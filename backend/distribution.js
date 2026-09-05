export function computeDistribution(scoredSectors, config) {
  // 1. Group sectors by district
  const districtMap = new Map();
  for (const sector of scoredSectors) {
    if (!districtMap.has(sector.district)) {
      districtMap.set(sector.district, {
        district: sector.district,
        totalPopulation: 0,
        avgAvailability: 0,
        sectorCount: 0,
        sectors: [],
        reportedCount: 0,
        reportedAvailabilitySum: 0
      });
    }
    const d = districtMap.get(sector.district);
    d.totalPopulation += sector.population || 0;
    d.sectorCount += 1;
    d.sectors.push({
      id: sector.id,
      name: sector.name,
      population: sector.population || 0,
      currentAvailability: sector.latestAvailability !== null && sector.latestAvailability !== undefined ? sector.latestAvailability : 50,
      projectedAvailability: 0,
      allocation_m3: 0,
      lpcd: 0,
    });
    
    if (sector.latestAvailability !== null && sector.latestAvailability !== undefined) {
      d.reportedCount += 1;
      d.reportedAvailabilitySum += sector.latestAvailability;
    }
  }

  const districts = [];
  let sumOfAllWeightedDeficits = 0;
  
  for (const d of districtMap.values()) {
    d.currentAvailability = d.reportedCount > 0 ? d.reportedAvailabilitySum / d.reportedCount : 50;
    
    // 2. Compute daily demand per district based on urban/rural target
    const isUrban = (config.urbanDistricts || []).includes(d.district);
    const perCapitaTarget = isUrban ? (config.perCapitaUrban_lpcd || 80) : (config.perCapitaRural_lpcd || 25);
    d.isUrban = isUrban;
    d.demand_m3 = (d.totalPopulation * perCapitaTarget) / 1000;
    
    // 3. Compute deficit per district
    const deficit_m3 = Math.max(0, d.demand_m3 * (1 - d.currentAvailability / 100));
    const stressTier = (config.stressTiers && config.stressTiers[d.district]) || 1.0;
    d.stressTier = stressTier;
    d.deficit_m3 = deficit_m3;
    d.weightedDeficit = deficit_m3 * stressTier;
    
    sumOfAllWeightedDeficits += d.weightedDeficit;
    districts.push(d);
  }

  const numDistricts = districts.length || 1;
  const basePoolPct = Number(config.basePoolPct ?? 0.30);
  const needPoolPct = Number(config.needPoolPct ?? 0.70);
  const basePool = config.totalSupply_m3 * basePoolPct;
  const needPool = config.totalSupply_m3 * needPoolPct;
  
  const baseAllocationPerDistrict = basePool / numDistricts;

  // 4, 5, 6. Initial Allocations (30% Base + 70% Need)
  for (const d of districts) {
    d.baseAllocation_m3 = baseAllocationPerDistrict;
    
    if (sumOfAllWeightedDeficits <= 0) {
      d.needAllocation_m3 = needPool / numDistricts;
    } else {
      d.needAllocation_m3 = needPool * (d.weightedDeficit / sumOfAllWeightedDeficits);
    }
    
    d.totalAllocation_m3 = d.baseAllocation_m3 + d.needAllocation_m3;
    const availBoost = d.demand_m3 > 0 ? (d.totalAllocation_m3 / d.demand_m3) * 100 : 0;
    d.projectedAvailability = Math.min(100, Math.max(d.currentAvailability, d.currentAvailability + availBoost));
  }

  // Count districts below floor before equity clamp
  const targetFloor = Number(config.targetFloorPct ?? 75);
  const targetCeiling = Number(config.targetCeilingPct ?? 85);
  let districtsBeforeFloorCount = 0;
  for (const d of districts) {
    if (d.projectedAvailability < targetFloor) {
      districtsBeforeFloorCount++;
    }
  }

  // 7. Equity clamp (iterative redistribution with volume conservation)
  let totalSurplusRedistributed_m3 = 0;
  for (let i = 0; i < 15; i++) {
    const belowFloor = districts.filter(d => d.projectedAvailability < targetFloor);
    const aboveCeiling = districts.filter(d => d.projectedAvailability > targetCeiling);
    
    if (belowFloor.length === 0 || aboveCeiling.length === 0) break;
    
    let totalSurplus_m3 = 0;
    for (const d of aboveCeiling) {
      if (d.currentAvailability >= targetCeiling) {
        // District already exceeds ceiling naturally, take back allocated water
        const surplus = d.totalAllocation_m3;
        if (surplus > 0) {
          totalSurplus_m3 += surplus;
          d.totalAllocation_m3 = 0;
          d.projectedAvailability = d.currentAvailability;
        }
      } else {
        const maxAllowedTotalAlloc = Math.max(0, ((targetCeiling - d.currentAvailability) / 100) * d.demand_m3);
        const surplus = d.totalAllocation_m3 - maxAllowedTotalAlloc;
        if (surplus > 0) {
          totalSurplus_m3 += surplus;
          d.totalAllocation_m3 = maxAllowedTotalAlloc;
          d.projectedAvailability = targetCeiling;
        }
      }
    }
    
    if (totalSurplus_m3 <= 0.001) break;
    totalSurplusRedistributed_m3 += totalSurplus_m3;
    
    // Redistribute surplus proportionally to deficit below floor
    const totalDeficitBelowFloor = belowFloor.reduce((sum, d) => {
      return sum + Math.max(0, ((targetFloor - d.projectedAvailability) / 100) * d.demand_m3);
    }, 0);
    
    if (totalDeficitBelowFloor <= 0.001) {
      // If no districts are below floor, distribute to any below ceiling or below 100%
      const belowCeiling = districts.filter(d => d.projectedAvailability < targetCeiling);
      const targets = belowCeiling.length > 0 ? belowCeiling : districts.filter(d => d.projectedAvailability < 100);
      if (targets.length > 0) {
        const share = totalSurplus_m3 / targets.length;
        for (const d of targets) {
          d.totalAllocation_m3 += share;
          const boost = d.demand_m3 > 0 ? (d.totalAllocation_m3 / d.demand_m3) * 100 : 0;
          d.projectedAvailability = Math.min(100, d.currentAvailability + boost);
        }
      }
      break;
    }

    let remainingSurplus = totalSurplus_m3;
    for (const d of belowFloor) {
      const targetDeficit_m3 = Math.max(0, ((targetFloor - d.projectedAvailability) / 100) * d.demand_m3);
      const shareRatio = targetDeficit_m3 / totalDeficitBelowFloor;
      const amountToAdd = Math.min(totalSurplus_m3 * shareRatio, targetDeficit_m3);
      
      d.totalAllocation_m3 += amountToAdd;
      remainingSurplus -= amountToAdd;
      const boost = d.demand_m3 > 0 ? (d.totalAllocation_m3 / d.demand_m3) * 100 : 0;
      d.projectedAvailability = Math.min(100, d.currentAvailability + boost);
    }

    if (remainingSurplus > 0.001) {
      const belowCeil = districts.filter(d => d.projectedAvailability < targetCeiling);
      const targets = belowCeil.length > 0 ? belowCeil : districts.filter(d => d.projectedAvailability < 100);
      if (targets.length > 0) {
        const share = remainingSurplus / targets.length;
        for (const d of targets) {
          d.totalAllocation_m3 += share;
          const boost = d.demand_m3 > 0 ? (d.totalAllocation_m3 / d.demand_m3) * 100 : 0;
          d.projectedAvailability = Math.min(100, d.currentAvailability + boost);
        }
      }
    }
  }

  // Calculate LPCD for each district
  for (const d of districts) {
    d.lpcd = d.totalPopulation > 0 ? (d.totalAllocation_m3 * 1000) / d.totalPopulation : 0;
  }

  // 8. Intra-district sector balancing
  const maxSpreadPct = Number(config.maxSectorSpreadPct ?? 25);
  for (const d of districts) {
    const isUrban = (config.urbanDistricts || []).includes(d.district);
    const perCapitaTarget = isUrban ? (config.perCapitaUrban_lpcd || 80) : (config.perCapitaRural_lpcd || 25);
    
    let sumSectorWeightedDeficits = 0;
    for (const s of d.sectors) {
      s.demand_m3 = (s.population * perCapitaTarget) / 1000;
      s.deficit_m3 = Math.max(0, s.demand_m3 * (1 - s.currentAvailability / 100));
      sumSectorWeightedDeficits += s.deficit_m3;
    }
    
    const districtBasePool = d.totalAllocation_m3 * basePoolPct;
    const districtNeedPool = d.totalAllocation_m3 * needPoolPct;
    const sectorCount = d.sectors.length || 1;
    const sectorBaseAlloc = districtBasePool / sectorCount;
    
    for (const s of d.sectors) {
      const baseAlloc = sectorBaseAlloc;
      let needAlloc = 0;
      if (sumSectorWeightedDeficits <= 0) {
        needAlloc = districtNeedPool / sectorCount;
      } else {
        needAlloc = districtNeedPool * (s.deficit_m3 / sumSectorWeightedDeficits);
      }
      s.allocation_m3 = baseAlloc + needAlloc;
      const boost = s.demand_m3 > 0 ? (s.allocation_m3 / s.demand_m3) * 100 : 0;
      s.projectedAvailability = Math.min(100, Math.max(s.currentAvailability, s.currentAvailability + boost));
      s.lpcd = s.population > 0 ? (s.allocation_m3 * 1000) / s.population : 0;
    }
    
    // Apply intra-district variance cap iteratively
    if (d.sectors.length > 1) {
      for (let i = 0; i < 10; i++) {
        let minSector = d.sectors[0];
        let maxSector = d.sectors[0];
        for (const s of d.sectors) {
          if (s.projectedAvailability < minSector.projectedAvailability) minSector = s;
          if (s.projectedAvailability > maxSector.projectedAvailability) maxSector = s;
        }
        
        const spread = maxSector.projectedAvailability - minSector.projectedAvailability;
        if (spread <= maxSpreadPct) break;
        
        const moveAvail = (spread - maxSpreadPct) / 2;
        const moveVolume = (moveAvail / 100) * Math.min(minSector.demand_m3, maxSector.demand_m3);
        
        if (moveVolume > 0 && maxSector.allocation_m3 >= moveVolume) {
          maxSector.allocation_m3 -= moveVolume;
          minSector.allocation_m3 += moveVolume;
          
          const maxBoost = maxSector.demand_m3 > 0 ? (maxSector.allocation_m3 / maxSector.demand_m3) * 100 : 0;
          const minBoost = minSector.demand_m3 > 0 ? (minSector.allocation_m3 / minSector.demand_m3) * 100 : 0;
          
          maxSector.projectedAvailability = Math.min(100, Math.max(maxSector.currentAvailability, maxSector.currentAvailability + maxBoost));
          minSector.projectedAvailability = Math.min(100, Math.max(minSector.currentAvailability, minSector.currentAvailability + minBoost));
          
          maxSector.lpcd = maxSector.population > 0 ? (maxSector.allocation_m3 * 1000) / maxSector.population : 0;
          minSector.lpcd = minSector.population > 0 ? (minSector.allocation_m3 * 1000) / minSector.population : 0;
        } else {
          break;
        }
      }
    }
  }

  // Calculate summary stats
  const totalAllocated = districts.reduce((sum, d) => sum + d.totalAllocation_m3, 0);
  const totalPop = districts.reduce((sum, d) => sum + d.totalPopulation, 0);
  const avgAvailBefore = totalPop > 0
    ? districts.reduce((sum, d) => sum + (d.currentAvailability * d.totalPopulation), 0) / totalPop
    : 0;
  const avgAvailAfter = totalPop > 0
    ? districts.reduce((sum, d) => sum + (d.projectedAvailability * d.totalPopulation), 0) / totalPop
    : 0;
  
  const districtsAfterFloor = districts.filter(d => d.projectedAvailability < targetFloor).length;

  // Equity index based on standard deviation of projected availability
  const avgProjAvail = districts.reduce((sum, d) => sum + d.projectedAvailability, 0) / (districts.length || 1);
  const variance = districts.reduce((sum, d) => sum + Math.pow(d.projectedAvailability - avgProjAvail, 2), 0) / (districts.length || 1);
  const stdDev = Math.sqrt(variance);
  const equityIndex = Math.max(0, Math.min(1, 1 - (stdDev / 100)));

  // Clean intermediate fields
  districts.forEach(d => {
    delete d.reportedCount;
    delete d.reportedAvailabilitySum;
    d.sectors.forEach(s => {
      delete s.deficit_m3;
    });
  });

  // Sort districts by current availability ascending (most critical need first)
  districts.sort((a, b) => a.currentAvailability - b.currentAvailability);

  return {
    summary: {
      totalSupply_m3: config.totalSupply_m3,
      totalAllocated_m3: totalAllocated,
      basePool_m3: basePool,
      needPool_m3: needPool,
      totalPopulation: totalPop,
      avgAvailabilityBefore: avgAvailBefore,
      avgAvailabilityAfter: avgAvailAfter,
      districtsBeforeFloor: districtsBeforeFloorCount,
      districtsAfterFloor: districtsAfterFloor,
      equityIndex: equityIndex,
      surplusRedistributed_m3: totalSurplusRedistributed_m3,
    },
    districts,
  };
}

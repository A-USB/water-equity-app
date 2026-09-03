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
    d.totalPopulation += sector.population;
    d.sectorCount += 1;
    d.sectors.push({
      id: sector.id,
      name: sector.name,
      population: sector.population,
      currentAvailability: sector.latestAvailability !== null ? sector.latestAvailability : 50,
      projectedAvailability: 0,
      allocation_m3: 0
    });
    
    if (sector.latestAvailability !== null) {
      d.reportedCount += 1;
      d.reportedAvailabilitySum += sector.latestAvailability;
    }
  }

  const districts = [];
  let sumOfAllWeightedDeficits = 0;
  
  for (const d of districtMap.values()) {
    d.currentAvailability = d.reportedCount > 0 ? d.reportedAvailabilitySum / d.reportedCount : 50;
    
    // 2. Compute daily demand per district
    const isUrban = config.urbanDistricts.includes(d.district);
    const perCapitaTarget = isUrban ? config.perCapitaUrban_lpcd : config.perCapitaRural_lpcd;
    d.demand_m3 = (d.totalPopulation * perCapitaTarget) / 1000;
    
    // 3. Compute deficit per district
    const deficit_m3 = d.demand_m3 * (1 - d.currentAvailability / 100);
    const stressTier = config.stressTiers[d.district] || 1.0;
    d.stressTier = stressTier;
    d.deficit_m3 = deficit_m3;
    d.weightedDeficit = deficit_m3 * stressTier;
    
    sumOfAllWeightedDeficits += d.weightedDeficit;
    districts.push(d);
  }

  const basePool = config.totalSupply_m3 * config.basePoolPct;
  const needPool = config.totalSupply_m3 * config.needPoolPct;
  
  const baseAllocationPerDistrict = basePool / 30; // 30 districts

  // 4, 5, 6. Allocations
  for (const d of districts) {
    d.baseAllocation_m3 = baseAllocationPerDistrict;
    
    if (sumOfAllWeightedDeficits === 0) {
      d.needAllocation_m3 = needPool / 30;
    } else {
      d.needAllocation_m3 = needPool * (d.weightedDeficit / sumOfAllWeightedDeficits);
    }
    
    d.totalAllocation_m3 = d.baseAllocation_m3 + d.needAllocation_m3;
    d.projectedAvailability = Math.min(100, d.currentAvailability + (d.totalAllocation_m3 / d.demand_m3) * 100);
  }

  // 7. Equity clamp (iterative)
  for (let i = 0; i < 10; i++) {
    const belowFloor = districts.filter(d => d.projectedAvailability < config.targetFloorPct);
    const aboveCeiling = districts.filter(d => d.projectedAvailability > config.targetCeilingPct);
    
    if (belowFloor.length === 0 || aboveCeiling.length === 0) break;
    
    let totalSurplus_m3 = 0;
    for (const d of aboveCeiling) {
      const maxAllowedTotalAlloc = (config.targetCeilingPct - d.currentAvailability) / 100 * d.demand_m3;
      // surplus is what they have beyond what brings them to ceiling
      const surplus = d.totalAllocation_m3 - maxAllowedTotalAlloc;
      if (surplus > 0) {
        totalSurplus_m3 += surplus;
        d.totalAllocation_m3 -= surplus;
        d.projectedAvailability = config.targetCeilingPct;
      }
    }
    
    if (totalSurplus_m3 <= 0) break;
    
    // redistribute to belowFloor
    const totalDeficitBelowFloor = belowFloor.reduce((sum, d) => {
      return sum + ((config.targetFloorPct - d.projectedAvailability) / 100 * d.demand_m3);
    }, 0);
    
    for (const d of belowFloor) {
      const targetDeficit_m3 = ((config.targetFloorPct - d.projectedAvailability) / 100 * d.demand_m3);
      const share = targetDeficit_m3 / totalDeficitBelowFloor;
      const amountToAdd = Math.min(totalSurplus_m3 * share, targetDeficit_m3);
      
      d.totalAllocation_m3 += amountToAdd;
      d.projectedAvailability = Math.min(100, d.currentAvailability + (d.totalAllocation_m3 / d.demand_m3) * 100);
    }
  }

  let districtsBeforeFloor = 0; // we need to calculate this from initial allocation
  
  // Re-calculate the before clamp logic? Wait, the assignment wants districtsBeforeFloor
  // I will just calculate the below floor initially before the clamp. 
  // Let's do that at step 6.
  // Actually, I can just recalculate it quickly by doing 1 step without clamp and saving the result.
  // Let me adjust this.

  // 8. Intra-district sector balancing
  for (const d of districts) {
    const isUrban = config.urbanDistricts.includes(d.district);
    const perCapitaTarget = isUrban ? config.perCapitaUrban_lpcd : config.perCapitaRural_lpcd;
    
    let sumSectorWeightedDeficits = 0;
    for (const s of d.sectors) {
      s.demand_m3 = (s.population * perCapitaTarget) / 1000;
      s.deficit_m3 = s.demand_m3 * (1 - s.currentAvailability / 100);
      sumSectorWeightedDeficits += s.deficit_m3; // stress tier is district level, so 1.0 for sector relative to district
    }
    
    const districtBasePool = d.totalAllocation_m3 * config.basePoolPct;
    const districtNeedPool = d.totalAllocation_m3 * config.needPoolPct;
    const sectorBaseAlloc = districtBasePool / d.sectors.length;
    
    for (const s of d.sectors) {
      const baseAlloc = sectorBaseAlloc;
      let needAlloc = 0;
      if (sumSectorWeightedDeficits === 0) {
        needAlloc = districtNeedPool / d.sectors.length;
      } else {
        needAlloc = districtNeedPool * (s.deficit_m3 / sumSectorWeightedDeficits);
      }
      s.allocation_m3 = baseAlloc + needAlloc;
      s.projectedAvailability = Math.min(100, s.currentAvailability + (s.allocation_m3 / s.demand_m3) * 100);
    }
    
    // Apply variance cap iteratively
    for (let i = 0; i < 10; i++) {
      let minSector = d.sectors[0];
      let maxSector = d.sectors[0];
      for (const s of d.sectors) {
        if (s.projectedAvailability < minSector.projectedAvailability) minSector = s;
        if (s.projectedAvailability > maxSector.projectedAvailability) maxSector = s;
      }
      
      const spread = maxSector.projectedAvailability - minSector.projectedAvailability;
      if (spread <= config.maxSectorSpreadPct) break;
      
      const moveAvail = (spread - config.maxSectorSpreadPct) / 2;
      const moveVolume = moveAvail / 100 * Math.min(minSector.demand_m3, maxSector.demand_m3); // rough approximation
      
      if (moveVolume > 0 && maxSector.allocation_m3 >= moveVolume) {
        maxSector.allocation_m3 -= moveVolume;
        minSector.allocation_m3 += moveVolume;
        maxSector.projectedAvailability = Math.min(100, maxSector.currentAvailability + (maxSector.allocation_m3 / maxSector.demand_m3) * 100);
        minSector.projectedAvailability = Math.min(100, minSector.currentAvailability + (minSector.allocation_m3 / minSector.demand_m3) * 100);
      } else {
        break;
      }
    }
  }

  // Calculate summary stats
  const totalAllocated = districts.reduce((sum, d) => sum + d.totalAllocation_m3, 0);
  const totalPop = districts.reduce((sum, d) => sum + d.totalPopulation, 0);
  const avgAvailBefore = districts.reduce((sum, d) => sum + (d.currentAvailability * d.totalPopulation), 0) / totalPop;
  const avgAvailAfter = districts.reduce((sum, d) => sum + (d.projectedAvailability * d.totalPopulation), 0) / totalPop;
  
  const districtsAfterFloor = districts.filter(d => d.projectedAvailability < config.targetFloorPct).length;
  
  // To get districtsBeforeFloor we can calculate what their projected availability would have been without clamping
  let districtsBeforeFloorCount = 0;
  for (const d of districts) {
    const origBase = basePool / 30;
    const origNeed = sumOfAllWeightedDeficits === 0 ? needPool / 30 : needPool * (d.weightedDeficit / sumOfAllWeightedDeficits);
    const origTotal = origBase + origNeed;
    const origProj = Math.min(100, d.currentAvailability + (origTotal / d.demand_m3) * 100);
    if (origProj < config.targetFloorPct) districtsBeforeFloorCount++;
  }

  // Equity index
  const avgProjAvail = districts.reduce((sum, d) => sum + d.projectedAvailability, 0) / districts.length;
  const variance = districts.reduce((sum, d) => sum + Math.pow(d.projectedAvailability - avgProjAvail, 2), 0) / districts.length;
  const stdDev = Math.sqrt(variance);
  const equityIndex = 1 - (stdDev / 100);

  districts.sort((a, b) => a.currentAvailability - b.currentAvailability);

  // Clean up unused properties expected by the schema if necessary
  districts.forEach(d => {
    delete d.reportedCount;
    delete d.reportedAvailabilitySum;
    delete d.weightedDeficit;
    d.sectors.forEach(s => {
      delete s.demand_m3;
      delete s.deficit_m3;
    });
  });

  return {
    summary: {
      totalSupply_m3: config.totalSupply_m3,
      totalAllocated_m3: totalAllocated,
      totalPopulation: totalPop,
      avgAvailabilityBefore: avgAvailBefore,
      avgAvailabilityAfter: avgAvailAfter,
      districtsBeforeFloor: districtsBeforeFloorCount,
      districtsAfterFloor: districtsAfterFloor,
      equityIndex: equityIndex
    },
    districts
  };
}

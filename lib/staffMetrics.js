/**
 * Calculate staff workload metrics
 * @param {Array} staffList - List of staff profiles
 * @param {Array} customers - List of customers
 * @returns {Object} Metrics object
 */
export function calculateStaffMetrics(staffList, customers) {
  if (!staffList || !customers) {
    return {
      totalActiveStaff: 0,
      totalAssignedCustomers: 0,
      staffAtCapacity: 0,
      highestWorkloadStaff: null,
      averageWorkload: 0,
    };
  }

  // Total staff aktif
  const activeStaff = staffList.filter(s => s.is_active !== false);
  const totalActiveStaff = activeStaff.length;

  // Hitung workload per staff
  const workloadMap = {};
  activeStaff.forEach(staff => {
    const assigned = customers.filter(c => c.assigned_to === staff.id);
    workloadMap[staff.id] = {
      count: assigned.length,
      staff: staff,
      maxLoad: staff.max_load ?? 10,
    };
  });

  // Total pelanggan yang ter-assign
  const totalAssignedCustomers = Object.values(workloadMap).reduce(
    (sum, wl) => sum + wl.count,
    0
  );

  // Staff dengan kapasitas penuh (count >= max_load)
  const staffAtCapacity = Object.values(workloadMap).filter(
    wl => wl.count >= wl.maxLoad
  ).length;

  // Staff dengan beban tertinggi
  let highestWorkloadStaff = null;
  let maxCount = 0;
  Object.values(workloadMap).forEach(wl => {
    if (wl.count > maxCount) {
      maxCount = wl.count;
      highestWorkloadStaff = {
        name: wl.staff.full_name,
        count: wl.count,
        maxLoad: wl.maxLoad,
        percentage: Math.round((wl.count / wl.maxLoad) * 100),
      };
    }
  });

  // Average workload
  const averageWorkload = totalActiveStaff > 0
    ? Math.round(totalAssignedCustomers / totalActiveStaff)
    : 0;

  return {
    totalActiveStaff,
    totalAssignedCustomers,
    staffAtCapacity,
    highestWorkloadStaff,
    averageWorkload,
  };
}

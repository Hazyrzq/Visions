/**
 * Generate weekly summary data untuk admin
 * @param {Array} customers - List of all customers
 * @param {Array} staffList - List of all staff
 * @returns {Object} Summary data
 */
export function generateWeeklySummary(customers, staffList) {
  if (!customers || !staffList) {
    return {
      highRiskCount: 0,
      highRiskUnhandled: [],
      staffPerformance: [],
      weekStartDate: new Date(),
      totalCustomers: 0,
    };
  }

  // High risk customers (churn_score >= 70)
  const highRisk = customers.filter(c => (c.churn_score ?? 0) >= 70);
  const highRiskUnhandled = highRisk.filter(c => !c.assigned_to);

  // Staff performance
  const staffPerformance = staffList
    .filter(s => s.role === 'staff' && s.is_active)
    .map(s => {
      const assigned = customers.filter(c => c.assigned_to === s.id);
      const highRiskCount = assigned.filter(c => (c.churn_score ?? 0) >= 70).length;
      const workload = assigned.length;
      const maxLoad = s.max_load ?? 10;
      const capacityPercent = Math.round((workload / maxLoad) * 100);

      return {
        name: s.full_name,
        email: s.email,
        totalAssigned: workload,
        maxCapacity: maxLoad,
        capacityPercent,
        highRiskCount,
        avgChurnScore:
          assigned.length > 0
            ? Math.round(
                assigned.reduce((sum, c) => sum + (c.churn_score ?? 0), 0) /
                  assigned.length
              )
            : 0,
      };
    })
    .sort((a, b) => b.highRiskCount - a.highRiskCount); // Sort by high risk count

  // Week start date (last Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStartDate = new Date(today.setDate(diff));

  return {
    highRiskCount: highRisk.length,
    highRiskUnhandled: highRiskUnhandled.slice(0, 10), // Limit ke 10
    staffPerformance,
    weekStartDate,
    totalCustomers: customers.length,
    assignedCount: customers.filter(c => c.assigned_to).length,
  };
}

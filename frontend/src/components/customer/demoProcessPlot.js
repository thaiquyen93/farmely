export function buildDemoProcessPlot(plot, season, demoTime, activeSeasonId, isSeasonStarted) {
  const hasActiveDemo = demoTime?.seasonKey === activeSeasonId;
  const isCurrentSeason = season.isCurrent || season.status === 'ACTIVE';
  const isFuture = !hasActiveDemo && plot.startDate && new Date(plot.startDate).setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0);
  const isScheduled = !hasActiveDemo && (!isCurrentSeason
    ? season.status === 'SCHEDULED'
    : !isSeasonStarted && (season.status === 'SCHEDULED' || season.currentDay === 0 || isFuture));
  const currentDay = hasActiveDemo ? demoTime.currentDay
    : !isCurrentSeason ? (season.status === 'COMPLETED' ? season.totalDays : 0)
      : isSeasonStarted ? Math.max(1, Number(season.currentDay ?? plot.currentDay) || 1)
        : isScheduled ? 0 : (season.currentDay || plot.currentDay || 0);
  const today = new Date();
  const demoStartDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    ...plot,
    crop: season.cropName || plot.crop,
    totalDays: season.totalDays || plot.totalDays,
    currentDay,
    seasonStatus: hasActiveDemo ? 'ACTIVE' : !isCurrentSeason ? season.status : isSeasonStarted ? 'ACTIVE' : season.status,
    isScheduled,
    startDate: hasActiveDemo ? demoStartDate : plot.startDate
  };
}

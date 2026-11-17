module.exports = (V) => { const L = 'site_prebuilt_skinwalker_ow_lake', N = 'site_prebuilt_skinwalker_ow_corn';
  return [
    ['lane_views', L, [V.fp(L, 'k_bend', -60, -105, 90), V.perf(L, 'p1', -60, -105, 90), V.fp(L, 'k_road_south', 21, -42, 180), V.perf(L, 'p2', 21, -42, 180), V.fp(L, 'k_footpath', -42, -21, 180), V.fp(L, 'k_shore_north', 8.4, 56, 0), V.perf(L, 'p3', 8.4, 56, 0), V.fp(L, 'k_shore_lake', 8.4, 56, 150), V.perf(L, 'p4', 8.4, 56, 150), V.top(L, 'k_above', 0.5)]],
    ['walk_corn_s', N, [V.walk(N, 'w_corn_south', 0, 112, 180, 200000)]],
    ['walk_lane_n', L, [V.walk(L, 'w_lane_north', -64.75, -112, 0, 200000)]],
    ['walk_lake_s', L, [V.walk(L, 'w_lake_south', 42, 160, 180, 200000)]],
  ]; };

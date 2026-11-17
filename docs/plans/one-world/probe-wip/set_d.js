module.exports = (V) => { const L = 'site_prebuilt_skinwalker_ow_lake', N = 'site_prebuilt_skinwalker_ow_corn', C = 'site_prebuilt_fairy_forest_ow_clearing', E = 'site_prebuilt_skinwalker_estate';
  return [
    ['corn', N, [V.fp(N, 's_gate_from_inside', -21, -112, 0), V.fp(N, 's_lane_south_end', 0, 100, 180), V.walk(N, 'w_corn_open', 0, 114, 180, 200000)]],
    ['lane', L, [V.fp(L, 's_lane_north_end', -64.75, -105, 0), V.fp(L, 's_footpath_north_end', -40.25, -108, 0), V.fp(L, 's_lake_south_end', 42, 150, 180), V.walk(L, 'w_lake_open', 42, 160, 180, 200000)]],
    ['lane_n', L, [V.walk(L, 'w_lane_open_free', -64.75, -116, 0, 200000)]],
    ['fence', C, [V.fp(C, 's_fence_line_gate', -105, 88, 180), V.walk(C, 'w_fence_line', -105, 96, 180, 200000)]],
    ['estate_n', E, [V.fp(E, 's_estate_north_end', 63, -50, 0)]],
  ]; };

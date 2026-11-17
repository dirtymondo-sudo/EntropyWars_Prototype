module.exports = (V) => { const C = 'site_prebuilt_fairy_forest_ow_clearing';
  return [
    ['joined_views', C, [V.fp(C, 'j_cross_east', -105, -40, 90), V.perf(C, 'p1', -105, -40, 90), V.fp(C, 'j_seam', -45, -36, 90), V.fp(C, 'j_creek_east', 63, -38.5, 90), V.perf(C, 'p2', 63, -38.5, 90), V.fp(C, 'j_creek_west', 63, -38.5, 270), V.perf(C, 'p3', 63, -38.5, 270), V.top(C, 'j_above', 0.42)]],
    ['walk_free', C, [V.walk(C, 'w_free_north', -203, -52, 0)]],
    ['walk_mouth', C, [V.walk(C, 'w_sewer_mouth', 196, -38.5, 90)]],
  ]; };

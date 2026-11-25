---
name: pizzeria-pack-pizzas-20261117
description: Pizza props exist in the Elbolilloduro Pizzeria PSX pack (CC0); the pizza box + pepperoni cut out for the Delivery Boy (PR #1934)
metadata:
  type: reference
  modified: 2026-11-17T09:04:57.834Z
---
mondo 11-17 asked "is there pizza from the model list or asset pack you can use?" MODEL_LIST had none by name, but the
source pack dirtymondo:project-files/asset-packs/elbolilloduro/pizzeria-psx/Pizzeria.rar (unrar with npm node-unrar-js; no
unrar/blender in the container) has Pizzeria/Models/Pizzeria_Props.glb with: Pizza_box.001 (lid, hinge pivot) + .002 (tray,
child, parent scale 2.66 must be baked) + .003 (closed box), pizzas Cheese/Ham/Mushroom/Olive/Pepper/Pineapple/Basil/
Pizza_Peperoni/Pizza_M/Pizza_S + 10 slices, plus kitchen props (ovens, dough mixer, sauces, sodas, money, phone).
Cut with gltf-transform: /mnt/project-files/delivery-boy-polish/cut-pizza-box.mjs ->
R2 Assets/world/packs/elbolilloduro/ebd_pizzeria_pizza_box.glb (nodes tray/lid/pizza), used by Hot and Fresh (_dbPackBox).
Lesson: search inside pack SOURCE files, not only MODEL_LIST [[model-list-master]].

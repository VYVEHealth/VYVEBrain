import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const BUCKET = 'exercise-videos';
const RENAMES = {
  "riverside_ab_crunch   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "ab-crunch-machine.mp4",
  "riverside_back_extension   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "back-extension-machine.mp4",
  "riverside_barbell_back squat _ jan 24, 2026 001_the_everyman podcas.mp4": "back-squat-barbell.mp4",
  "riverside_barbell_bent over row _ jan 24, 2026 001_the_everyman podcas.mp4": "bent-over-row-barbell.mp4",
  "riverside_barbell_bicep curl _ jan 24, 2026 001_the_everyman podcas.mp4": "bicep-curl-barbell.mp4",
  "riverside_barbell_deadlift _ jan 24, 2026 001_the_everyman podcas.mp4": "deadlift-barbell.mp4",
  "riverside_barbell_romanian deadlift _ jan 24, 2026 001_the_everyman podcas.mp4": "romanian-deadlift-barbell.mp4",
  "riverside_bench_press   smith ma... _ jan 24, 2026 001_the_everyman podcas.mp4": "bench-press-smith-machine.mp4",
  "riverside_bench_press _ jan 24, 2026 001_the_everyman podcas.mp4": "bench-press-barbell.mp4",
  "riverside_bent_over row   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "bent-over-row-cable.mp4",
  "riverside_bicep_curls   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "bicep-curl-cable.mp4",
  "riverside_box_squat _ jan 24, 2026 001_the_everyman podcas.mp4": "box-squat.mp4",
  "riverside_cable_reverse flies _ jan 24, 2026 001_the_everyman podcas.mp4": "reverse-fly-cable.mp4",
  "riverside_cable_seated row   neu... _ jan 24, 2026 001_the_everyman podcas.mp4": "seated-row-v-grip-cable.mp4",
  "riverside_cable_seated row   wid... _ jan 24, 2026 001_the_everyman podcas.mp4": "lat-pulldown-cable.mp4",
  "riverside_cable_seated row   wid... _ jan 25, 2026 003_the_everyman podcas.mp4": "lat-pulldown-underhand-grip-cable.mp4",
  "riverside_chest_fly   cable   mid _ jan 24, 2026 001_the_everyman podcas.mp4": "chest-fly-cable.mp4",
  "riverside_chest_fly   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "chest-fly-machine.mp4",
  "riverside_chest_press   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "chest-press-cable.mp4",
  "riverside_chest_press   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "chest-press-machine.mp4",
  "riverside_chin_ups _ jan 24, 2026 001_the_everyman podcas.mp4": "pull-ups.mp4",
  "riverside_clean_press   kettlebell _ jan 24, 2026 001_the_everyman podcas.mp4": "single-arm-clean-press-kettlebell.mp4",
  "riverside_crunches__ jan 24, 2026 001_the_everyman podcas.mp4": "ab-crunches.mp4",
  "riverside_dumbbell_chest press _ jan 24, 2026 001_the_everyman podcas.mp4": "bench-press-dumbbell.mp4",
  "riverside_dumbbell_lateral raise _ jan 24, 2026 001_the_everyman podcas.mp4": "lateral-raise-dumbbell.mp4",
  "riverside_dumbbell_romanian dead... _ jan 29, 2026 001_the_everyman podcas.mp4": "romanian-deadlift-dumbbell.mp4",
  "riverside_dumbbell_row _ jan 24, 2026 001_the_everyman podcas.mp4": "dumbbell-row.mp4",
  "riverside_facepulls_  cable _ jan 24, 2026 001_the_everyman podcas.mp4": "face-pull-cable.mp4",
  "riverside_floor_press _ jan 24, 2026 001_the_everyman podcas.mp4": "floor-press-dumbbells.mp4",
  "riverside_glute_bridge   dumbbell _ jan 24, 2026 001_the_everyman podcas.mp4": "glute-bridge-dumbbell.mp4",
  "riverside_glute_bridge   kettlebell _ jan 24, 2026 001_the_everyman podcas.mp4": "glute-bridge-kettlebell.mp4",
  "riverside_glute_bridge _ jan 24, 2026 001_the_everyman podcas.mp4": "glute-bridge.mp4",
  "riverside_goblet_squat   dumbbell _ jan 24, 2026 001_the_everyman podcas.mp4": "goblet-squat-dumbbell.mp4",
  "riverside_goblet_squat   kettlebell _ jan 24, 2026 001_the_everyman podcas.mp4": "goblet-squat-kettlebell.mp4",
  "riverside_hack_squat   plate loaded _ jan 24, 2026 001_the_everyman podcas.mp4": "hack-squat-plate-loaded.mp4",
  "riverside_hammer_curl dumbbell _ jan 24, 2026 001_the_everyman podcas.mp4": "standing-hammer-curls-dumbbell.mp4",
  "riverside_incline_bench press   ... _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-bench-press-smith-machine.mp4",
  "riverside_incline_bench press _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-bench-press-dumbbell.mp4",
  "riverside_kettlebell_around the ... _ jan 24, 2026 001_the_everyman podcas.mp4": "around-the-world-kettlebell.mp4",
  "riverside_kettlebell_swings _ jan 24, 2026 001_the_everyman podcas.mp4": "kettlebell-swings.mp4",
  "riverside_kneeling_pushup _ jan 24, 2026 001_the_everyman podcas.mp4": "kneeling-push-ups.mp4",
  "riverside_lat_pull down   cable ... _ jan 24, 2026 001_the_everyman podcas.mp4": "kneeling-lat-pulldown-single-arm-cable.mp4",
  "riverside_lat_pull down   plate ... _ jan 24, 2026 001_the_everyman podcas.mp4": "lat-pulldown-plate-loaded.mp4",
  "riverside_lateral_raise   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "lateral-raise-cable.mp4",
  "riverside_leg_extension _ jan 24, 2026 001_the_everyman podcas.mp4": "leg-extension-machine.mp4",
  "riverside_leg_press   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "leg-press.mp4",
  "riverside_low_plank _ jan 24, 2026 001_the_everyman podcas.mp4": "low-plank.mp4",
  "riverside_narrow_squat   smith m... _ jan 24, 2026 001_the_everyman podcas.mp4": "squat-smith-machine.mp4",
  "riverside_pull_up  assisted _ jan 24, 2026 001_the_everyman podcas.mp4": "assisted-pull-up.mp4",
  "riverside_push_up _ jan 24, 2026 001_the_everyman podcas.mp4": "push-ups.mp4",
  "riverside_reverse_lunges _ jan 24, 2026 001_the_everyman podcas.mp4": "reverse-lunges.mp4",
  "riverside_romanian_deadlift   ke... _ jan 24, 2026 001_the_everyman podcas.mp4": "romanian-deadlift-kettlebell.mp4",
  "riverside_rope_overhead extensio... _ jan 24, 2026 001_the_everyman podcas.mp4": "overhead-rope-extension-cable.mp4",
  "riverside_rope_pull down   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "tricep-rope-pushdown-cable.mp4",
  "riverside_russian_twist   kettle... _ jan 24, 2026 001_the_everyman podcas.mp4": "russian-twist-kettlebell.mp4",
  "riverside_seated_calf press _ jan 24, 2026 001_the_everyman podcas.mp4": "calf-raise-leg-press-machine.mp4",
  "riverside_seated_curl   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "seated-leg-curl.mp4",
  "riverside_seated_dumbbell should... _ jan 24, 2026 001_the_everyman podcas.mp4": "seated-shoulder-press-dumbbell.mp4",
  "riverside_seated_single arm row ... _ jan 24, 2026 001_the_everyman podcas.mp4": "seated-row-plate-loaded.mp4",
  "riverside_shoulder_press   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "shoulder-press-machine.mp4",
  "riverside_shoulder_press   neutr... _ jan 24, 2026 001_the_everyman podcas.mp4": "shoulder-press-neutral-machine.mp4",
  "riverside_shoulder_press   plate... _ jan 24, 2026 001_the_everyman podcas.mp4": "shoulder-press-plate-loaded.mp4",
  "riverside_shoulder_press   smith... _ jan 24, 2026 001_the_everyman podcas.mp4": "shoulder-press-smith-machine.mp4",
  "riverside_sit_ups _ jan 24, 2026 001_the_everyman podcas.mp4": "sit-ups.mp4",
  "riverside_split_squat   dumbbells _ jan 24, 2026 001_the_everyman podcas.mp4": "split-squats-dumbbells.mp4",
  "riverside_squat_  kettlebell _ jan 24, 2026 001_the_everyman podcas.mp4": "squat-kettlebell.mp4",
  "riverside_squat__ jan 24, 2026 001_the_everyman podcas.mp4": "squat.mp4",
  "riverside_standing_dumbbell bice... _ jan 24, 2026 001_the_everyman podcas.mp4": "bicep-curl-dumbbell.mp4",
  "riverside_standing_dumbbell shou... _ jan 24, 2026 001_the_everyman podcas.mp4": "standing-shoulder-press-dumbbells.mp4",
  "riverside_tricep_push down   cab... _ jan 24, 2026 001_the_everyman podcas.mp4": "tricep-pushdown-v-grip-cable.mp4",
  "riverside_alternating_lunges _ jan 24, 2026 001_the_everyman podcas.mp4": "alternating-lunges.mp4",
  "riverside_assault_bike _ jan 24, 2026 001_the_everyman podcas.mp4": "assault-bike.mp4",
  "riverside_barbell_front raise _ jan 24, 2026 001_the_everyman podcas.mp4": "front-raise-barbell.mp4",
  "riverside_barbell_overhead press _ jan 24, 2026 001_the_everyman podcas.mp4": "overhead-press-barbell.mp4",
  "riverside_barbell_upright row _ jan 24, 2026 001_the_everyman podcas.mp4": "upright-row-barbell.mp4",
  "riverside_bike__ jan 24, 2026 001_the_everyman podcas.mp4": "stationary-bike.mp4",
  "riverside_bulgarian_split squat _ jan 24, 2026 001_the_everyman podcas.mp4": "bulgarian-split-squat.mp4",
  "riverside_chest_supported row   ... _ jan 24, 2026 001_the_everyman podcas.mp4": "chest-supported-row.mp4",
  "riverside_clean_press   dumbbell _ jan 24, 2026 001_the_everyman podcas.mp4": "clean-press-dumbbell.mp4",
  "riverside_cross_trainer _ jan 24, 2026 001_the_everyman podcas.mp4": "cross-trainer.mp4",
  "riverside_dead_bug _ jan 24, 2026 001_the_everyman podcas.mp4": "dead-bug.mp4",
  "riverside_decline_bench press _ jan 24, 2026 001_the_everyman podcas.mp4": "decline-bench-press.mp4",
  "riverside_dips__ jan 24, 2026 001_the_everyman podcas.mp4": "dips.mp4",
  "riverside_dips_  assisted _ jan 24, 2026 001_the_everyman podcas.mp4": "dips-assisted.mp4",
  "riverside_dumbbell_flies _ jan 24, 2026 001_the_everyman podcas.mp4": "dumbbell-flies.mp4",
  "riverside_dumbbell_squat _ jan 24, 2026 001_the_everyman podcas.mp4": "squat-dumbbell.mp4",
  "riverside_farmers_carry _ jan 24, 2026 001_the_everyman podcas.mp4": "farmers-carry.mp4",
  "riverside_front_raise   dumbbell _ jan 24, 2026 001_the_everyman podcas.mp4": "front-raise-dumbbell.mp4",
  "riverside_heel_taps _ jan 24, 2026 001_the_everyman podcas.mp4": "heel-taps.mp4",
  "riverside_high_plank _ jan 24, 2026 001_the_everyman podcas.mp4": "high-plank.mp4",
  "riverside_hip_abduction   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "hip-abduction-machine.mp4",
  "riverside_hip_adduction   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "hip-adduction-machine.mp4",
  "riverside_incline_press   neutra... _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-press-neutral-grip.mp4",
  "riverside_incline_press   plate ... _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-press-plate-loaded.mp4",
  "riverside_incline_push up _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-push-up.mp4",
  "riverside_incline_walking   trea... _ jan 24, 2026 001_the_everyman podcas.mp4": "incline-walking-treadmill.mp4",
  "riverside_jogging_  treadmill _ jan 24, 2026 001_the_everyman podcas.mp4": "jogging-treadmill.mp4",
  "riverside_knee_tucks _ jan 24, 2026 001_the_everyman podcas.mp4": "knee-tucks.mp4",
  "riverside_leg_press (plate loaded) _ jan 24, 2026 001_the_everyman podcas.mp4": "leg-press-plate-loaded.mp4",
  "riverside_leg_raise _ jan 24, 2026 001_the_everyman podcas.mp4": "leg-raise.mp4",
  "riverside_preacher_curl _ jan 24, 2026 001_the_everyman podcas.mp4": "preacher-curl-barbell.mp4",
  "riverside_preacher_curl   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "preacher-curl-machine.mp4",
  "riverside_preacher_curl (plate l... _ jan 24, 2026 001_the_everyman podcas.mp4": "preacher-curl-plate-loaded.mp4",
  "riverside_recumbent_bike _ jan 24, 2026 001_the_everyman podcas.mp4": "recumbent-bike.mp4",
  "riverside_reverse_flies   machine _ jan 24, 2026 001_the_everyman podcas.mp4": "reverse-flies-machine.mp4",
  "riverside_reverse_lunge   smitch... _ jan 24, 2026 001_the_everyman podcas.mp4": "reverse-lunge-smith-machine.mp4",
  "riverside_rope_hammer curls   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "hammer-curls-cable.mp4",
  "riverside_rope_pullover   cable _ jan 24, 2026 001_the_everyman podcas.mp4": "pullover-cable.mp4",
  "riverside_rowing_machine _ jan 24, 2026 001_the_everyman podcas.mp4": "rowing-machine.mp4",
  "riverside_russian_twist   medici... _ jan 24, 2026 001_the_everyman podcas.mp4": "russian-twist-medicine-ball.mp4",
  "riverside_side_plank _ jan 24, 2026 001_the_everyman podcas.mp4": "side-plank.mp4",
  "riverside_ski_erg _ jan 24, 2026 001_the_everyman podcas.mp4": "ski-erg.mp4",
  "riverside_sled__ jan 24, 2026 001_the_everyman podcas.mp4": "sled.mp4",
  "riverside_split_squat _ jan 24, 2026 001_the_everyman podcas.mp4": "split-squat.mp4",
  "riverside_split_squat   smith ma... _ jan 24, 2026 001_the_everyman podcas.mp4": "split-squat-smith-machine.mp4",
  "riverside_stair_master _ jan 24, 2026 001_the_everyman podcas.mp4": "stair-master.mp4",
  "riverside_sumo_squat   smith mac... _ jan 24, 2026 001_the_everyman podcas.mp4": "sumo-squat-smith-machine.mp4",
  "riverside_tricep_extension   mac... _ jan 24, 2026 001_the_everyman podcas.mp4": "tricep-extension-machine.mp4",
  "riverside_walking_  treadmill _ jan 24, 2026 001_the_everyman podcas.mp4": "walking-treadmill.mp4",
  "riverside_wall_balls _ jan 24, 2026 001_the_everyman podcas.mp4": "wall-balls.mp4",
  "riverside_wall_push up _ jan 24, 2026 001_the_everyman podcas.mp4": "wall-push-up.mp4",
  "riverside_wall_sit _ jan 24, 2026 001_the_everyman podcas.mp4": "wall-sit.mp4"
};
const DELETE_ROOT_DUPS = [
  "riverside_cable_bicep curl _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_clean_press   dumbbell _ jan 29, 2026 003_the_everyman podcas.mp4",
  "riverside_clean_press   kettlebell _ jan 29, 2026 003_the_everyman podcas.mp4",
  "riverside_front_raise  barbell _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_incline_dumbbell press _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_kneeling_pushups _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_lat_pull down   cable _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_leg_raises _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_preacher_curl   machine _ jan 29, 2026 003_the_everyman podcas.mp4",
  "riverside_pull_up _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_seated_row   cable   v... _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_single_arm lat pull do... _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_single_arm lat pulldow... _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_squat_  smith machine _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_squat_ kettlebell _ jan 24, 2026 001_the_everyman podcas.mp4",
  "riverside_standing_dumbbell row _ jan 24, 2026 001_the_everyman podcas.mp4"
];
Deno.serve(async ()=>{
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const results = {
    renamed: [],
    rename_errors: [],
    deleted: [],
    delete_errors: []
  };
  // 1. Delete Exercise Videos/ subfolder
  const { data: subfolderFiles } = await supabase.storage.from(BUCKET).list('Exercise Videos', {
    limit: 300
  });
  if (subfolderFiles && subfolderFiles.length > 0) {
    const paths = subfolderFiles.map((f)=>`Exercise Videos/${f.name}`);
    for(let i = 0; i < paths.length; i += 20){
      const batch = paths.slice(i, i + 20);
      const { error } = await supabase.storage.from(BUCKET).remove(batch);
      if (error) results.delete_errors.push({
        batch: i,
        error: error.message
      });
      else results.deleted.push(...batch);
    }
  }
  // 2. Delete root duplicates
  for (const name of DELETE_ROOT_DUPS){
    const { error } = await supabase.storage.from(BUCKET).remove([
      name
    ]);
    if (error) results.delete_errors.push({
      file: name,
      error: error.message
    });
    else results.deleted.push(name);
  }
  // 3. Delete any remaining (1) files
  const { data: allFiles } = await supabase.storage.from(BUCKET).list('', {
    limit: 300
  });
  if (allFiles) {
    const oneFiles = allFiles.filter((f)=>f.name.endsWith('(1).mp4'));
    for (const f of oneFiles){
      const { error } = await supabase.storage.from(BUCKET).remove([
        f.name
      ]);
      if (error) results.delete_errors.push({
        file: f.name,
        error: error.message
      });
      else results.deleted.push(f.name);
    }
  }
  // 4. Rename: copy then delete
  for (const [oldName, newName] of Object.entries(RENAMES)){
    const { error: copyError } = await supabase.storage.from(BUCKET).copy(oldName, newName);
    if (copyError) {
      results.rename_errors.push({
        old: oldName,
        new: newName,
        error: copyError.message
      });
      continue;
    }
    const { error: delError } = await supabase.storage.from(BUCKET).remove([
      oldName
    ]);
    if (delError) {
      results.rename_errors.push({
        old: oldName,
        new: newName,
        error: 'copied but delete failed: ' + delError.message
      });
      continue;
    }
    results.renamed.push({
      old: oldName,
      new: newName
    });
  }
  return new Response(JSON.stringify({
    summary: {
      renamed: results.renamed.length,
      deleted: results.deleted.length,
      rename_errors: results.rename_errors.length,
      delete_errors: results.delete_errors.length
    },
    details: results
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

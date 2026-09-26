// Masters the final MP4: measures loudness (pass 1), then encodes the picture
// master with the normalized score (pass 2). Also exports a poster frame.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
const dir = import.meta.dirname, FF = '/opt/homebrew/bin/ffmpeg';
const OUT = path.join(dir, '../lawscape-demo-30s.mp4'), POSTER = path.join(dir, '../lawscape-demo-30s-poster.jpg');
function run(args, capture = false) {
  const p = spawn(FF, args, { stdio: ['ignore', 'inherit', capture ? 'pipe' : 'inherit'] }); let err = '';
  if (capture) p.stderr.on('data', (d) => { err += d; });
  return once(p, 'close').then(([code]) => { if (code !== 0) throw new Error('ffmpeg failed: ' + code); return err; });
}
const TARGET = 'I=-16:TP=-1.5:LRA=11';
const pass1 = await run(['-hide_banner', '-i', path.join(dir, 'score.wav'), '-af', `loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-'], true);
const m = JSON.parse(pass1.slice(pass1.lastIndexOf('{'), pass1.lastIndexOf('}') + 1));
console.log('Measured', m.input_i, 'LUFS, TP', m.input_tp, 'LRA', m.input_lra);
const ln = `loudnorm=${TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
await run(['-hide_banner', '-loglevel', 'warning', '-y',
  '-i', path.join(dir, 'picture.mp4'), '-i', path.join(dir, 'score.wav'),
  '-map', '0:v:0', '-map', '1:a:0',
  '-vf', 'scale=in_range=auto:out_range=tv:out_color_matrix=bt709,format=yuv420p',
  '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-af', ln,
  '-t', '30', '-movflags', '+faststart',
  '-metadata', 'title=LawScape — A New Way to Learn Legal Ethics (30-second demo)',
  '-metadata', 'comment=Original 30-second demo of the LawScape 0.5 local build with an original synthesized chiptune score.',
  OUT]);
await run(['-hide_banner', '-loglevel', 'warning', '-y', '-ss', '1.6', '-i', OUT, '-frames:v', '1', '-update', '1', '-q:v', '2', POSTER]);
console.log('Exported', OUT, 'and', POSTER);

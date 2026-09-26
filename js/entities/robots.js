// Original character art: scripted personalities, with no live AI service.
function line(ctx, points, color, width=1) {
  ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
}
function rounded(ctx,x,y,w,h,r,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
function oval(ctx,x,y,rx,ry,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill(); }
function polygon(ctx,points,color) { ctx.fillStyle=color; ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill(); }

export function drawRobotButler(ctx,x,y,t) {
  ctx.save(); ctx.translate(x,y);
  oval(ctx,0,2,15,5,'#10191840');
  for (const side of [-1,1]) {
    rounded(ctx,side*4-2.5,-36,5,32,2,'#20282e');
    line(ctx,[[side*4,-32],[side*4,-5]],'#596468',.7);
    rounded(ctx,side*4-3,-4,9,4,1.5,'#111b23');
  }
  polygon(ctx,[[-10,-58],[10,-58],[8,-36],[10,-22],[3,-27],[0,-34],[-3,-27],[-10,-22],[-8,-36]],'#18232a');
  polygon(ctx,[[-4,-60],[4,-60],[5,-38],[-5,-38]],'#eee9da');
  polygon(ctx,[[-5,-60],[-9,-55],[-4,-47],[0,-38],[-2,-54]],'#3c464c');
  polygon(ctx,[[5,-60],[9,-55],[4,-47],[0,-38],[2,-54]],'#303b43');
  for (let yy=-48;yy<-37;yy+=4) oval(ctx,0,yy,.7,.7,'#b9a66c');
  polygon(ctx,[[-1,-56],[-4,-58],[-4,-54],[0,-55],[4,-54],[4,-58],[1,-56]],'#101a22');
  line(ctx,[[-9,-56],[-13,-44],[-10,-34]],'#293841',5);
  oval(ctx,-10,-32,2.3,3.4,'#f5f0dd');
  line(ctx,[[9,-56],[14,-44],[23,-43]],'#293841',5);
  oval(ctx,23,-42,3.2,2,'#f5f0dd');
  oval(ctx,25,-46,12,3,'#8faaa9');
  line(ctx,[[14,-47],[35,-47]],'#e0e4cd',1.2);
  rounded(ctx,24,-60,6,12,1,'#abc8c67a');
  rounded(ctx,25,-55,4,6,1,'#ae7134');
  line(ctx,[[25,-59],[25,-51]],'#e3eeeb',.7);
  rounded(ctx,-2,-66,4,7,1,'#9eafaf');
  rounded(ctx,-7,-80,14,16,4,'#9eafb0');
  rounded(ctx,-5.7,-78.7,11.4,11.5,3,'#c9d5cd');
  rounded(ctx,-5,-75,10,4,1.5,'#223f45');
  const glow=.65+Math.sin(t*1.3)*.15;
  ctx.globalAlpha=glow; line(ctx,[[-3.5,-73],[-1.5,-73]],'#a6eee0',1.2); line(ctx,[[1.5,-73],[3.5,-73]],'#a6eee0',1.2); ctx.globalAlpha=1;
  line(ctx,[[-2,-68],[2,-68]],'#526868',.9);
  oval(ctx,-7.5,-72,1.4,2.2,'#6b8585'); oval(ctx,7.5,-72,1.4,2.2,'#6b8585');
  line(ctx,[[5,-82],[5,-85]],'#b59c64',.8); oval(ctx,5,-86,1.4,1.4,'#bfe7d4');
  ctx.restore();
}

export function drawSleepingJudge(ctx,x,y,t) {
  ctx.save();ctx.translate(x,y);
  // A tall padded judicial chair; the bench is drawn in front by the caller.
  rounded(ctx,-17,-91,34,66,5,'#5c3a2b');
  rounded(ctx,-13,-87,26,51,5,'#31483f');
  for (const xx of [-9,0,9]) for (const yy of [-80,-68,-56]) oval(ctx,xx,yy,.85,.85,'#a39668');
  line(ctx,[[-18,-49],[-18,-27]],'#8f724c',3);line(ctx,[[18,-49],[18,-27]],'#8f724c',3);
  polygon(ctx,[[-6,-69],[-14,-63],[-17,-32],[17,-32],[14,-63],[6,-69]],'#19212c');
  for (const xx of [-10,-5,5,10]) line(ctx,[[xx,-58],[xx*1.2,-33]],'#3b4350',1.4);
  polygon(ctx,[[-5,-68],[5,-68],[2,-56],[-2,-56]],'#ece6d5');
  ctx.save();ctx.translate(1,-70);ctx.rotate(.18+Math.sin(t*.9)*.025);
  rounded(ctx,-8,-18,16,18,4,'#9fb1b7');rounded(ctx,-6,-16,12,12,3,'#c5cfce');
  // Closed eyelids on a dim robot faceplate.
  rounded(ctx,-6,-13,12,6,2,'#34505a');
  line(ctx,[[-4,-10],[-1.5,-9.4]],'#a5c7c4',.8);line(ctx,[[1.5,-9.4],[4,-10]],'#a5c7c4',.8);
  line(ctx,[[-2,-4],[2,-4]],'#637978',.8);ctx.restore();
  oval(ctx,-11,-38,3,2,'#bcc9c6');oval(ctx,11,-38,3,2,'#bcc9c6');
  ctx.fillStyle='#bbcdcc';ctx.font='italic 11px Georgia';ctx.textAlign='center';
  ctx.fillText('z',23,-91-Math.sin(t)*2);ctx.fillText('Z',31,-101-Math.sin(t)*2);
  ctx.restore();
}

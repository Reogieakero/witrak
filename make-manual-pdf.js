const fs = require('fs');
const zlib = require('zlib');

// ---------- PDF primitives ----------
function esc(s){return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}

// We draw using a vector content stream. We'll build per-page content arrays.
function rect(x,y,w,h,fill){
  return `${fill} ${x} ${y} ${w} ${h} re f`;
}
function roundRect(x,y,w,h,r,fill,stroke){
  // approximate rounded corners with lines + arcs
  let s = '';
  if(stroke) s += `${stroke} `;
  s += `${fill} `;
  s += `${x+r} ${y} l ${x+w-r} ${y} l `;
  s += `${x+w} ${y+r} l ${x+w} ${y+h-r} l `;
  s += `${x+w-r} ${y+h} l ${x+r} ${y+h} l `;
  s += `${x} ${y+h-r} l ${x} ${y+r} l `;
  s += 'h ' + (stroke ? 'B' : 'f');
  return s;
}

let objects = []; // array of strings (object bodies)
let offsets = [];

function addObject(body){
  const num = objects.length + 1;
  objects.push(body);
  return num;
}

// gradient helper: we draw many thin vertical strips to fake a linear gradient
function gradientStripes(x,y,w,h,c0,c1,steps){
  const out=[];
  for(let i=0;i<steps;i++){
    const t=i/(steps-1);
    const col=mix(c0,c1,t);
    out.push(rect(x + (w*i/steps), y, (w/steps)+0.6, h, col));
  }
  return out.join('\n');
}
function hexToRgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function mix(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);const r=Math.round(A[0]+(B[0]-A[0])*t),g=Math.round(A[1]+(B[1]-A[1])*t),bl=Math.round(A[2]+(B[2]-A[2])*t);return `0.${r.toString(16).padStart(2,'0')} 0.${g.toString(16).padStart(2,'0')} 0.${bl.toString(16).padStart(2,'0')} rg`;}
const C = {
  white:'1 1 1 rg', black:'0 0 0 rg',
  brand50:'0.937 0.965 1 rg', brand100:'0.859 0.922 1 rg', brand200:'0.749 0.871 1 rg',
  brand400:'0.376 0.631 0.98 rg', brand500:'0.231 0.510 0.965 rg', brand600:'0.149 0.388 0.922 rg',
  brand700:'0.114 0.306 0.847 rg', brand800:'0.118 0.251 0.690 rg', brand900:'0.118 0.227 0.541 rg',
  textStrong:'0.067 0.094 0.153 rg', textSubtle:'0.216 0.243 0.318 rg', textMuted:'0.420 0.447 0.502 rg', textFaint:'0.612 0.639 0.686 rg',
  border:'0.898 0.918 0.933 rg',
  grad0:'#ffffff', grad1:'#eff6ff', grad2:'#bfdbfe', grad3:'#93c5fd',
  red:'0.969 0.373 0.341 rg', amber:'0.996 0.737 0.180 rg', green:'0.157 0.804 0.290 rg',
  pagebg:'0.976 0.980 0.984 rg'
};

function text(x,y,str,size,color,font){
  font=font||'F1';
  return `BT /${font} ${size} Tf ${color} 1 0 0 1 ${x} ${y} Tm (${esc(str)}) Tj ET`;
}
// text with leading wrap
function textBlock(x,y,str,size,color,maxw,font,leading){
  font=font||'F1';
  const out=[];
  let cy=y;
  const words=String(str).split(' ');
  let line='';
  for(const w of words){
    const test=line?line+' '+w:w;
    if(test.length*size*0.5 > maxw && line){
      out.push(`BT /${font} ${size} Tf ${color} 1 0 0 1 ${x} ${cy} Tm (${esc(line)}) Tj ET`);
      line=w; cy-=leading;
    } else line=test;
  }
  if(line) out.push(`BT /${font} ${size} Tf ${color} 1 0 0 1 ${x} ${cy} Tm (${esc(line)}) Tj ET`);
  return {stream:out.join('\n'), endY: cy-leading};
}

// circle (for numbered badges)
function circle(cx,cy,r,fill){
  return `${fill} ${cx} ${cy} ${r} 0 360 arc f`;
}

// ---------- Build pages ----------
const PAGES=[];
function newPage(){const p={stream:[]};PAGES.push(p);return p;}

// Common background for a poster page (1080x1080 logical scaled to 612x792)
const SX=612/1080, SY=792/1080;
function sx(v){return v*SX;}
function sy(v){return v*SY;} // but PDF y is bottom-up; caller handles

// We'll use a coordinate transform: draw in 1080-space but flip y.
function posterBg(p){
  // white page
  p.stream.push(rect(0,0,612,792,C.white));
  // gradient (vertical-ish): use horizontal strips mixing grad0->grad3
  // fake diagonal by mixing across width
  const steps=60;
  for(let i=0;i<steps;i++){
    const t=i/(steps-1);
    const col=mix('#ffffff','#93c5fd', t*0.85);
    p.stream.push(rect(sx(1080*i/steps),0, sx(1080/steps)+0.7,792,col));
  }
}

// flip helper: PDF y bottom-up. We author in top-down 1080 coordinates.
function Y(topY){ return 792 - sy(topY); }

// Header (logo + wordmark)
function header(p){
  // logo chip
  p.stream.push(roundRect(sx(56),Y(56+56)-sy(56),sx(56),sy(56),sx(16),C.brand600));
  p.stream.push(circle(sx(56+28),Y(56+28),sx(18),C.white));
  p.stream.push(text(sx(56+20),Y(56+34),'L',20,C.brand600));
  // wordmark
  p.stream.push(text(sx(56+72),Y(56+24),'LIBER',22,C.textStrong,'F2'));
  p.stream.push(text(sx(56+72)+ 92,Y(56+24),'ALIS',22,C.brand600,'F2'));
  // official pill
  p.stream.push(roundRect(sx(56+72)+ 175,Y(56+20)-sy(18),sx(70),sy(18),sx(9),C.brand50));
  p.stream.push(text(sx(56+72)+ 185,Y(56+26),'Official',9,C.brand700));
  p.stream.push(text(sx(56+72),Y(56+48),'STUDENT GOVERNMENT MANAGEMENT SYSTEM',9,C.textMuted));
}

// macOS frame
function macFrame(p,x,y,w,h,url){
  const X=sx(x), Yt=Y(y+h);
  p.stream.push(roundRect(X,Yt,sx(w),sy(h),sx(14),C.white,C.border));
  // top bar
  p.stream.push(roundRect(X,Yt,sx(w),sy(40),sx(14),'0.953 0.957 0.965 rg'));
  p.stream.push(circle(X+sx(20),Yt+sy(20),sx(5),C.red));
  p.stream.push(circle(X+sx(38),Yt+sy(20),sx(5),C.amber));
  p.stream.push(circle(X+sx(56),Yt+sy(20),sx(5),C.green));
  p.stream.push(roundRect(X+sx(78),Yt+sy(9),sx(w-100),sy(22),sx(5),C.white,C.border));
  p.stream.push(text(X+sx(86),Yt+sy(26),url,8,C.textMuted));
}

// ---- PAGE 1: COVER ----
{
  const p=newPage();
  posterBg(p);
  p.stream.push(rect(0,0,612,792,C.pagebg));
  const steps=80;
  for(let i=0;i<steps;i++){const t=i/(steps-1);p.stream.push(rect(612*i/steps,0,612/steps+0.7,792,mix('#ffffff','#bfdbfe',t*0.8)));}
  // logo
  p.stream.push(roundRect(sx(54),Y(360)-sy(70),sx(70),sy(70),sx(18),C.brand600));
  p.stream.push(circle(sx(54+35),Y(360+35),sx(22),C.white));
  p.stream.push(text(sx(54+22),Y(360+44),'LIBERALIS',16,C.brand600,'F2'));
  p.stream.push(text(sx(54),Y(470),'Student User Manual',34,C.textStrong,'F2'));
  p.stream.push(textBlock(sx(54),Y(520),'Sign in, complete your profile, and explore your portal — a clear guide for every student.',13,C.textSubtle,520,'F1',18).stream);
  p.stream.push(roundRect(sx(54),Y(600)-sy(40),sx(220),sy(40),sx(10),C.brand600));
  p.stream.push(text(sx(76),Y(600-14),'Get started',14,C.white,'F2'));
  p.stream.push(text(sx(54),Y(700),'Liberalis  •  Student Government Management System',10,C.textMuted));
  p.stream.push(text(sx(54),Y(720),'portal.liberalis.app',10,C.textMuted));
}

// ---- generic poster page renderer ----
function posterPage(opts){
  const p=newPage();
  posterBg(p);
  header(p);
  // headline badge
  p.stream.push(roundRect(sx(56),Y(150)-sy(30),sx(opts.badgeW),sy(30),sx(14),C.brand50));
  p.stream.push(text(sx(70),Y(150-12),opts.badge,11,C.brand700));
  // headline
  p.stream.push(text(sx(56),Y(200),opts.headline,38,C.textStrong,'F2'));
  if(opts.headline2) p.stream.push(text(sx(56),Y(245),opts.headline2,38,C.brand600,'F2'));
  // copy
  if(opts.copy) p.stream.push(textBlock(sx(56),Y(300),opts.copy,13,C.textSubtle,560,'F1',18).stream);

  // left steps / reminders or right card depending on type
  if(opts.type==='signin'){
    // workflow strip full width
    drawWorkflow(p, 360, opts.steps, 4);
    // right mac card
    macFrame(p, 620, 470, 404, 360, 'portal.liberalis.app/sign-in');
    drawSignInCard(p, 620+16, 470+40+8, 404-32, 360-40-16);
  }
  if(opts.type==='profile'){
    // left reminders parent card
    drawProfileLeft(p, 360);
    // right mac form card
    macFrame(p, 560, 150, 464, 600, 'portal.liberalis.app/complete-profile');
    drawProfileForm(p, 560+0, 150, 464);
  }
  if(opts.type==='overview'){
    drawOverview(p, 340);
  }
  // footer
  footer(p, opts.url);
  return p;
}

function footer(p,url){
  p.stream.push(roundRect(sx(56),Y(1040)-sy(0),sx(0),sy(0),0,C.border)); // spacer noop
  p.stream.push(circle(sx(60),Y(1044),sx(4),C.brand600));
  p.stream.push(text(sx(72),Y(1044-6),'Official Student Portal Gateway',10,C.textSubtle));
  p.stream.push(text(sx(560),Y(1044-6),url+'   •   Need Assistance? Contact Support',9,C.textMuted));
}

function drawWorkflow(p, topY, steps, n){
  const w=1040, gap=16, cardW=(w-gap*(n-1))/n;
  let x=56;
  p.stream.push(text(sx(56),Y(topY-4),'HOW TO SIGN IN',10,C.textFaint));
  let cy=topY+18;
  for(let i=0;i<n;i++){
    const X=sx(x), Yt=Y(cy+44);
    p.stream.push(roundRect(X,Yt,sx(cardW),sy(44),sx(12),C.white,C.border));
    p.stream.push(circle(X+sx(22),Yt+sy(22),sx(11),C.brand600));
    p.stream.push(text(X+sx(16),Yt+sy(28),String(i+1),11,C.white,'F2'));
    p.stream.push(text(X+sx(40),Yt+sy(27),steps[i],10,C.textSubtle));
    if(i<n-1) p.stream.push(text(X+sx(cardW)+3,Yt+sy(28),'>',12,C.brand400));
    x+=cardW+gap;
  }
}

function drawSignInCard(p, x, y, w, h){
  const X=sx(x), Yt=Y(y+h);
  p.stream.push(roundRect(X,Yt,sx(w),sy(h),sx(8),C.white));
  p.stream.push(text(X+sx(20),Yt+sy(28),'Student Sign-In',14,C.textStrong,'F2'));
  p.stream.push(text(X+sx(20),Yt+sy(46),'Use your school Google account to continue.',9,C.textMuted));
  // google button
  const by=Yt+sy(70);
  p.stream.push(roundRect(X+sx(20),by,sx(w-40),sy(40),sx(8),C.white,C.border));
  p.stream.push(text(X+sx(36),by+sy(24),'G',13,C.brand600,'F2'));
  p.stream.push(text(X+sx(70),by+sy(25),'Sign in with Google',11,C.textStrong,'F2'));
  // footer line
  const fy=by+sy(70);
  p.stream.push(text(X+sx(20),fy+sy(10),'Secured by OAuth',9,C.brand600));
  p.stream.push(text(X+sx(180),fy+sy(10),'-> Complete Profile',9,C.textSubtle));
  p.stream.push(textBlock(X+sx(20),fy+sy(34),'By continuing you agree to the student conduct policy. Your attendance is recorded privately and visible only to scoped officers.',8,C.textFaint,sx(w-40),'F1',11).stream);
}

function drawProfileLeft(p, topY){
  // parent card
  const X=sx(56), Yt=Y(topY+ (44*2+24) + 20);
  const ph=sy(44*2+24+40);
  p.stream.push(roundRect(X,Yt,sx(480),ph,sx(16),C.white,C.border));
  p.stream.push(text(X+sx(16),Yt+sy(18),'HOW IT WORKS',10,C.textFaint));
  const rem=[
    ['Sign in','Use your school Google account to start.'],
    ['Fill details','Add photo, name & student number.'],
    ['Confirm','Pick program, year & section.'],
    ['Access portal','Everything unlocked - no re-entry needed.']
  ];
  let cy=Yt+sy(40);
  for(let i=0;i<4;i++){
    const rX=X+sx(16), rY=cy;
    p.stream.push(roundRect(rX,rY,sx(448),sy(44),sx(10),'0.976 0.980 0.984 rg','0.953 0.957 0.965 rg'));
    p.stream.push(circle(rX+sx(22),rY+sy(22),sx(12),C.brand600));
    p.stream.push(text(rX+sx(15),rY+sy(28),String(i+1),11,C.white,'F2'));
    p.stream.push(text(rX+sx(42),rY+sy(18),rem[i][0],12,C.textStrong,'F2'));
    p.stream.push(text(rX+sx(42),rY+sy(36),rem[i][1],9,C.textMuted));
    cy+=sy(52);
  }
}

function drawProfileForm(p, x, y, w){
  // form card below mac bar
  const X=sx(x), Yt=Y(y+600-40); // top of form area (under bar)
  const formH=sy(600-40-16);
  p.stream.push(roundRect(X,Yt,sx(w),formH,sx(0),C.white));
  let cy=Yt+sy(20);
  const pad=sx(20);
  p.stream.push(text(X+pad,cy,'Complete your student profile',14,C.textStrong,'F2')); cy-=sy(20);
  p.stream.push(text(X+pad,cy,'Your Google account (juan@school.edu) is not registered yet. Fill in your details to continue.',8,C.textMuted)); cy-=sy(26);
  // avatar
  p.stream.push(roundRect(X+pad,cy-sy(40),sx(40),sy(40),sx(20),'0.937 0.965 1 rg','0.749 0.871 1 rg'));
  p.stream.push(text(X+pad+sy(14),cy-sy(24),'+',14,C.brand500,'F2'));
  p.stream.push(text(X+pad+sx(52),cy-sy(24),'Upload your photo',9,C.textMuted)); cy-=sy(52);
  // email
  p.stream.push(text(X+pad,cy,'Email',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(roundRect(X+pad,cy-sy(24),sx(w-40),sy(24),sx(6),C.pagebg,C.border));
  p.stream.push(text(X+pad+sx(6),cy-sy(15),'juan@school.edu',9,C.textMuted)); cy-=sy(34);
  // first/last
  p.stream.push(text(X+pad,cy,'First name',9,C.textSubtle)); 
  p.stream.push(text(X+sx(w/2+4),cy,'Last name',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(roundRect(X+pad,cy-sy(24),sx(w/2-24),sy(24),sx(6),C.white,C.border));
  p.stream.push(roundRect(X+sx(w/2+4),cy-sy(24),sx(w/2-24),sy(24),sx(6),C.white,C.border));
  p.stream.push(text(X+pad+sx(6),cy-sy(15),'Juan',9,C.textFaint));
  p.stream.push(text(X+sx(w/2+10),cy-sy(15),'Dela Cruz',9,C.textFaint)); cy-=sy(34);
  // suffix
  p.stream.push(text(X+pad,cy,'Name suffix (optional)',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(field(X+pad,cy, sx(w-40),'None',p)); cy-=sy(34);
  // student no
  p.stream.push(text(X+pad,cy,'Student number',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(field(X+pad,cy, sx(w-40),'e.g. 2025-0001',p)); cy-=sy(34);
  // program/year
  p.stream.push(text(X+pad,cy,'Program',9,C.textSubtle));
  p.stream.push(text(X+sx(w/2+4),cy,'Year level',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(field(X+pad,cy, sx(w/2-24),'Select program...',p));
  p.stream.push(field(X+sx(w/2+4),cy, sx(w/2-24),'Select program first',p)); cy-=sy(34);
  // section
  p.stream.push(text(X+pad,cy,'Section',9,C.textSubtle)); cy-=sy(16);
  p.stream.push(field(X+pad,cy, sx(w-40),'Select year first',p)); cy-=sy(40);
  // submit
  p.stream.push(roundRect(X+pad,cy-sy(34),sx(w-40),sy(34),sx(8),C.brand600));
  p.stream.push(text(X+pad+sx(60),cy-sy(22),'Complete profile',12,C.white,'F2'));
}
function field(X,Yt,w,placeholder,p){
  p.stream.push(roundRect(X,Yt-sy(24),w,sy(24),sx(6),C.white,C.border));
  p.stream.push(text(X+sx(6),Yt-sy(15),placeholder,9,C.textFaint));
  // chevron
  p.stream.push(text(X+w-sx(16),Yt-sy(15),'v',8,C.textMuted));
  return w;
}

function drawOverview(p, topY){
  p.stream.push(text(sx(56),Y(topY-4),'MY OVERVIEW',10,C.textFaint));
  const kpis=[['Attendance','12 attended','2 absences'],['Fees','P0 balance','no pending'],['Events','3 upcoming','1 live now'],['Records','0 sanctions','9 files']];
  const w=1040,gap=16,cardW=(w-gap*3)/4; let x=56; let cy=topY+18;
  for(let i=0;i<4;i++){
    const X=sx(x),Yt=Y(cy+80);
    p.stream.push(roundRect(X,Yt,sx(cardW),sy(80),sx(14),C.white,C.border));
    p.stream.push(roundRect(X+sx(14),Yt+sy(48),sx(28),sy(28),sx(8),C.brand50));
    p.stream.push(text(X+sx(18),Yt+sy(62),String(i+1),11,C.brand600,'F2'));
    p.stream.push(text(X+sx(14),Yt+sy(20),kpis[i][0],9,C.textMuted));
    p.stream.push(text(X+sx(14),Yt+sy(38),kpis[i][1],16,C.textStrong,'F2'));
    p.stream.push(text(X+sx(14),Yt+sy(70),kpis[i][2],8,C.textFaint));
    x+=cardW+gap;
  }
  // what you see cards
  let cy2=cy+100;
  p.stream.push(text(sx(56),Y(cy2-4),'WHAT STUDENTS CAN SEE',10,C.textFaint));
  const secs=[['Announcements','Latest org notices, dated & authored.'],['Events','Upcoming & live, QR check-in.'],['Attendance','Your own scan status per event.'],['Transparency','Financial, minutes & reports files.'],['Sanctions','Only your own flags (private).'],['Fees','View dues, upload proof, track.']];
  const w2=1040,gap2=16,cardW2=(w2-gap2*2)/3; let col=0,x2=56; let rowY=cy2+18;
  for(let i=0;i<6;i++){
    const X=sx(x2),Yt=Y(rowY+78);
    p.stream.push(roundRect(X,Yt,sx(cardW2),sy(78),sx(14),C.white,C.border));
    p.stream.push(roundRect(X+sx(14),Yt+sy(46),sx(24),sy(24),sx(7),C.brand50));
    p.stream.push(text(X+sx(18),Yt+sy(58),String(i+1),9,C.brand600,'F2'));
    p.stream.push(text(X+sx(14),Yt+sy(20),secs[i][0],12,C.textStrong,'F2'));
    p.stream.push(textBlock(X+sx(14),Yt+sy(38),secs[i][1],9,C.textMuted,sx(cardW2-28),'F1',12).stream);
    if(col<2){col++;x2+=cardW2+gap2;} else {col=0;x2=56;rowY+=96;}
  }
}

// ---- Build the three poster pages ----
posterPage({type:'signin', badge:'FAST ATTENDANCE EXPERIENCE', badgeW:230,
  headline:'Check-In Starts with a', headline2:'Single Scan.',
  copy:'Mark your attendance in seconds. Officers publish the event, you sign in with your school Google account, and presence is verified instantly - no paper, no lost rows, no queues.',
  steps:['Go to portal.liberalis.app','Click Sign in with Google','Select your account',"You're checked in"],
  url:'portal.liberalis.app/sign-in'});

posterPage({type:'profile', badge:'ONE STEP FROM DONE', badgeW:170,
  headline:'Complete Your', headline2:'Student Profile.',
  copy:'Signed in with Google? Finish your profile once and unlock attendance, events, fees and sanctions - all in one verified portal.',
  url:'portal.liberalis.app/complete-profile'});

posterPage({type:'overview', badge:'YOUR STUDENT PORTAL', badgeW:180,
  headline:'One Dashboard.', headline2:'Everything You Need.',
  copy:'After you sign in, your portal brings attendance, fees, events and records together - clear, private and always up to date.',
  url:'portal.liberalis.app/dashboard'});

// ---- Text/flow page ----
{
  const p=newPage();
  p.stream.push(rect(0,0,612,792,C.white));
  // header band
  p.stream.push(rect(0,792-60,612,60,C.brand600));
  p.stream.push(text(36,792-38,'Liberalis - Student User Manual (Quick Reference)',14,C.white,'F2'));
  let y=792-90;
  const sections=[
    ['SIGN IN',['1. Go to portal.liberalis.app','2. Click "Sign in with Google"','3. Select your account','4. You are checked in']],
    ['COMPLETE PROFILE (first time only)',['Upload photo (required)','Email is auto-filled from Google','First name + Last name (required)','Name suffix (optional: Jr/Sr/II-V)','Student number (format 20XX-XXXX)','Program -> Year level -> Section','Submit: "Complete profile"']],
    ['PORTAL OVERVIEW',['Attendance: your present/late/absent','Fees: balance, upload proof','Events: upcoming & live, QR','Transparency: financial/minutes/reports','Sanctions: only your own (private)','Announcements: org notices']],
    ['SCOPE NOTE',['Students see own records only.','Attendance.view (self), sanctions.view_own,','fees.view (own proofs), transparency.view.','Officer data is never shown.']]
  ];
  for(const [t,items] of sections){
    p.stream.push(text(36,y,t,12,C.brand700,'F2')); y-=20;
    for(const it of items){ p.stream.push(text(48,y,'- '+it,10,C.textSubtle)); y-=15; }
    y-=10;
  }
  p.stream.push(text(36,y-6,'Need help? Contact Support via portal.liberalis.app',9,C.textMuted));
}

// ---------- Assemble PDF ----------
function buildContent(objNum){
  // content stream object already created; we pass body
}
const objBodies=[];
// 1 catalog, 2 pages, then page objects + content objects
const pageObjNums=[];
const contentObjNums=[];
// reserve catalog=1, pages=2
objBodies[1]='<< /Type /Catalog /Pages 2 0 R >>';
objBodies[2]='<< /Type /Pages /Kids ['+PAGES.map((_,i)=>(3+i*2)+' 0 R').join(' ')+'] /Count '+PAGES.length+' >>';
for(let i=0;i<PAGES.length;i++){
  const pageNum=3+i*2;
  const contentNum=pageNum+1;
  pageObjNums.push(pageNum);
  contentObjNums.push(contentNum);
  const stream=PAGES[i].stream.join('\n');
  objBodies[contentNum]='<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream';
  objBodies[pageNum]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 '+ (3+PAGES.length*2) +' 0 R /F2 '+(4+PAGES.length*2)+' 0 R >> >> /Contents '+contentNum+' 0 R >>';
}
const font1Num=3+PAGES.length*2;
const font2Num=4+PAGES.length*2;
objBodies[font1Num]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
objBodies[font2Num]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

// write file
let pdf='%PDF-1.4\n';
const offs={};
for(let n=1;n<objBodies.length;n++){
  if(!objBodies[n]) continue;
  offs[n]=Buffer.byteLength(pdf,'latin1');
  pdf+=n+' 0 obj\n'+objBodies[n]+'\nendobj\n';
}
const xrefPos=Buffer.byteLength(pdf,'latin1');
const total=objBodies.length; // highest+1
pdf+='xref\n0 '+total+'\n';
pdf+='0000000000 65535 f \n';
for(let n=1;n<total;n++){
  if(objBodies[n]) pdf+=('0000000000'+offs[n]).slice(-10)+' 00000 n \n';
  else pdf+='0000000000 65535 f \n';
}
pdf+='trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xrefPos+'\n%%EOF';
fs.writeFileSync('C:\\Fhusocom\\student-user-manual.pdf',pdf,'latin1');
console.log('Wrote student-user-manual.pdf pages=',PAGES.length,'bytes=',Buffer.byteLength(pdf,'latin1'));

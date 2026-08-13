import React, {useMemo, useState} from 'react'
import {course,sections,clos,assessment,weeks,specialEvents,closedDates} from './data'

const months=[
  {y:2026,m:7,label:'สิงหาคม 2569'},
  {y:2026,m:8,label:'กันยายน 2569'},
  {y:2026,m:9,label:'ตุลาคม 2569'},
  {y:2026,m:10,label:'พฤศจิกายน 2569'},
  {y:2026,m:11,label:'ธันวาคม 2569'},
]
const weekdays=['อา','จ','อ','พ','พฤ','ศ','ส']
const monthMap={'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12}

const examEvent={
  date:'2026-12-03',
  time:'13.00–16.00 น.',
  title:'สอบปลายภาค TE101',
  detail:'วันพฤหัสบดีที่ 3 ธันวาคม 2569 เวลา 13.00–16.00 น.',
  type:'exam'
}

const fmt=(iso)=>new Intl.DateTimeFormat('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'))

function parseSessionDate(label){
  const m=label.match(/(\d{1,2})\s+(ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/)
  if(!m) return null
  return `2026-${String(monthMap[m[2]]).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`
}

function Calendar({selectedSec,onPick}){
  const [mi,setMi]=useState(0)
  const {y,m,label}=months[mi]
  const first=new Date(y,m,1), last=new Date(y,m+1,0)
  const cells=[...Array(first.getDay()).fill(null)]
  for(let d=1;d<=last.getDate();d++) cells.push(new Date(y,m,d))
  while(cells.length%7) cells.push(null)

  const getItems=(iso)=>{
    const arr=[]

    // Special course activities
    specialEvents.forEach(e=>{
      if(e.date!==iso) return
      const secMatch=selectedSec==='all'||e.title.includes(`Sec ${selectedSec}`)||!e.title.includes('Sec ')
      if(secMatch) arr.push({title:e.title,time:e.time||'',type:e.type||'special',detail:e.detail||''})
    })

    // Final examination — student-visible
    if(examEvent.date===iso) arr.push(examEvent)

    // No-class dates
    closedDates.forEach(e=>{
      if(e.date===iso&&(selectedSec==='all'||e.secs.includes(Number(selectedSec)))){
        arr.push({title:`งดเรียน Sec ${e.secs.join(', ')}`,time:'',type:'closed',detail:e.label})
      }
    })

    // Normal classes / section-specific sessions
    weeks.forEach(w=>w.sessions.forEach(s=>{
      const date=parseSessionDate(s[1])
      if(date!==iso) return
      const matchesSec=selectedSec==='all'||s[0].includes(`Sec ${selectedSec}`)||s[0]==='ทุก Sec'
      if(!matchesSec||s[3].includes('งด')) return
      const type=s[3].includes('สอบกลางภาค')?'midterm':'class'
      arr.push({title:`${s[0]} · ${s[3]}`,time:s[2],type,detail:`สัปดาห์ที่ ${w.week}: ${w.theme}`})
    }))

    const seen=new Set()
    return arr.filter(x=>{
      const k=[x.title,x.time,x.type].join('|')
      if(seen.has(k)) return false
      seen.add(k); return true
    })
  }

  return <div className="calendar">
    <div className="calendarHead">
      <button onClick={()=>setMi(Math.max(0,mi-1))} disabled={mi===0}>‹</button>
      <h2>{label}</h2>
      <button onClick={()=>setMi(Math.min(months.length-1,mi+1))} disabled={mi===months.length-1}>›</button>
    </div>
    <div className="dow">{weekdays.map(x=><div key={x}>{x}</div>)}</div>
    <div className="calendarGrid">
      {cells.map((d,i)=>{
        if(!d) return <div className="day empty" key={`e${i}`}/>
        const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        const items=getItems(iso)
        return <button className={`day ${items.length?'hasItems':''}`} key={iso} onClick={()=>onPick({iso,items})}>
          <b>{d.getDate()}</b>
          <div className="dayEvents">
            {items.slice(0,2).map((x,j)=><span className={`eventChip ${x.type}`} key={j}>{x.title}</span>)}
            {items.length>2&&<small className="moreEvents">+{items.length-2} รายการ</small>}
          </div>
        </button>
      })}
    </div>
  </div>
}

function DayDetail({picked,onClose}){
  if(!picked) return null
  return <div className="modalBg" onClick={onClose}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={onClose}>×</button>
      <span className="eyebrow">ปฏิทิน</span>
      <h2>{fmt(picked.iso)}</h2>
      {picked.items.length===0?<p className="muted">ไม่มีรายการของรายวิชาในวันนี้</p>:
        <div className="detailEvents">{picked.items.map((x,i)=><article className={x.type} key={i}>
          <b>{x.title}</b>{x.time&&<strong>{x.time}</strong>}{x.detail&&<p>{x.detail}</p>}
        </article>)}</div>}
    </div>
  </div>
}

function WeekModal({w,onClose}){
  if(!w) return null
  return <div className="modalBg" onClick={onClose}>
    <div className="modal weekModal" onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={onClose}>×</button>
      <span className="eyebrow">สัปดาห์ที่ {w.week} · {w.range}</span>
      <h2>{w.theme}</h2>
      <p className="lead">{w.content}</p>
      {w.teach?.length>0&&<section>
        <h3>หัวข้อสำคัญ</h3>
        <ul>{w.teach.map(x=><li key={x}>{x}</li>)}</ul>
      </section>}
      <section className="projectBox">
        <h3>สิ่งที่เชื่อมโยงกับ Final Project</h3>
        <p>{w.project}</p>
      </section>
      {w.clo&&<div className="cloTag">CLO {w.clo} — {clos[w.clo]}</div>}
    </div>
  </div>
}

function SectionView({sec}){
  const info=sections[sec]
  const rows=[]
  weeks.forEach(w=>w.sessions.forEach(s=>{
    if(s[0].includes(`Sec ${sec}`)||s[0]==='ทุก Sec'){
      rows.push({week:w.week,date:s[1],time:s[2],title:s[3],theme:w.theme})
    }
  }))
  specialEvents.forEach(e=>{
    if(!e.title.includes('Sec ')||e.title.includes(`Sec ${sec}`)){
      rows.push({week:'พิเศษ',date:fmt(e.date),time:e.time,title:e.title,theme:e.detail})
    }
  })
  return <div>
    <div className="secHero">
      <div><span className="eyebrow">SECTION {sec}</span><h2>TE101 Sec {sec}</h2></div>
      <div><b>{info.day}</b><span>{info.time} น.</span><small>ห้อง {info.room}</small></div>
    </div>
    <div className="sectionRows">
      {rows.map((r,i)=><article key={i}>
        <div className="rowWeek">{r.week==='พิเศษ'?'★':r.week}</div>
        <div><b>{r.date}</b><span>{r.time}</span></div>
        <div><h3>{r.title}</h3><p>{r.theme}</p></div>
      </article>)}
      <article className="examRow">
        <div className="rowWeek">สอบ</div>
        <div><b>พฤ. 3 ธ.ค. 2569</b><span>13.00–16.00 น.</span></div>
        <div><h3>สอบปลายภาค TE101</h3><p>กำหนดการสอบปลายภาคของรายวิชา</p></div>
      </article>
    </div>
  </div>
}

function Assessment(){
  const grade=[['A','80–100'],['B+','75–79'],['B','70–74'],['C+','65–69'],['C','60–64'],['D+','55–59'],['D','50–54'],['F','0–49']]
  return <div>
    <div className="pageTitle"><span className="eyebrow">ASSESSMENT</span><h2>การวัดและประเมินผล</h2></div>
    <div className="assessLayout">
      <section className="scoreCard">
        <h3>องค์ประกอบคะแนน</h3>
        {assessment.map(([name,score])=><div key={name}><span>{name}</span><b>{score} คะแนน</b></div>)}
        <div className="total"><span>รวม</span><b>100 คะแนน</b></div>
      </section>
      <section className="gradeCard">
        <h3>เกณฑ์การตัดเกรด</h3>
        {grade.map(([g,s])=><div key={g}><b>{g}</b><span>{s}</span></div>)}
      </section>
    </div>
    <div className="policy">
      <h3>การเข้าเรียน</h3>
      <p>ขาดเรียนได้ไม่เกิน 3 ครั้ง หากขาดเรียนเกิน 3 ครั้ง หมดสิทธิ์สอบปลายภาค</p>
      <p>ขาดเรียนหักคะแนนครั้งละ 1 คะแนน และหากมาสายหลังจากเช็กชื่อแล้ว หักคะแนนครั้งละ 0.5 คะแนน</p>
    </div>
    <div className="examBanner"><span>สอบปลายภาค</span><b>3 ธันวาคม 2569</b><strong>13.00–16.00 น.</strong></div>
  </div>
}

function Project(){
  const phases=[
    ['Week 2','รับโจทย์และแบ่งทีม Bidding','เริ่มจากวัตถุประสงค์ กลุ่มเป้าหมาย และแนวคิดหลัก'],
    ['Week 3–5','พัฒนาแนวคิด','พัฒนากิจกรรม กำหนดการ ประสบการณ์ สถานที่ และความเป็นไปได้'],
    ['Week 6','Event Bidding','นำเสนอ Proposal และคัดเลือก 1 Winning Project ต่อ Section'],
    ['หลัง Midterm','Project Kick-off','รวมทั้ง Section เป็นทีมเดียว แบ่งตำแหน่งและเริ่มผลิตงาน'],
    ['ปลาย ต.ค.–ต้น พ.ย.','Live Event','ดำเนินการจัด Public Event จริงตามวันของแต่ละโครงการ'],
    ['หลังงาน','Debrief & Evaluation','สรุปผล ปัญหา บทเรียน และประเมินประสบการณ์ผู้เข้าร่วม']
  ]
  const deliver=[
    'ชื่อและแนวคิดหลักของงาน','วัตถุประสงค์และกลุ่มเป้าหมาย','รูปแบบกิจกรรมและประสบการณ์ผู้เข้าร่วม',
    'สถานที่และความเป็นไปได้ของโครงการ','กำหนดการกิจกรรมเบื้องต้น','แผนประชาสัมพันธ์เบื้องต้น',
    'อุปกรณ์และทรัพยากรที่ต้องใช้'
  ]
  return <div>
    <div className="projectHero">
      <span className="eyebrow">FINAL PROJECT</span>
      <h2>1 Section = 1 Public Event</h2>
      <p>นักศึกษาจะเริ่มจากการคิดและแข่งขันนำเสนอแนวคิดภายใน Section ก่อนคัดเลือก 1 โครงการเพื่อร่วมกันพัฒนาและจัดขึ้นจริง</p>
    </div>
    <h2 className="blockTitle">เส้นทางของโครงการ</h2>
    <div className="phaseGrid">{phases.map(([a,b,c])=><article key={a}><span>{a}</span><h3>{b}</h3><p>{c}</p></article>)}</div>
    <h2 className="blockTitle">สิ่งที่ควรมีใน Event Bidding</h2>
    <div className="deliverGrid">{deliver.map((x,i)=><div key={x}><b>{String(i+1).padStart(2,'0')}</b><span>{x}</span></div>)}</div>
    <div className="noteBox"><b>หมายเหตุ</b><p>รายละเอียดของวันจัดงานจริงแต่ละ Section จะประกาศเพิ่มเติมเมื่อ Winning Project และแผนการผลิตมีความพร้อม</p></div>
  </div>
}

function CourseInfo(){
  return <div>
    <div className="courseHero">
      <div><span className="eyebrow">TE101</span><h2>อุตสาหกรรมอีเว้นท์</h2><p>{course.semester}</p></div>
      <div className="courseExam"><span>สอบปลายภาค</span><b>3 ธ.ค. 2569</b><strong>13.00–16.00 น.</strong></div>
    </div>
    <section className="infoSection"><h3>คำอธิบายรายวิชา</h3><p>{course.description}</p></section>
    <section className="infoSection"><h3>ผลลัพธ์การเรียนรู้ของรายวิชา (CLO)</h3><div className="cloGrid">{Object.entries(clos).map(([n,t])=><article key={n}><b>CLO {n}</b><span>{t}</span></article>)}</div></section>
    <section className="infoSection"><h3>กิจกรรมสำคัญ</h3><div className="quickEvents">
      <article><b>Guest Speaker</b><span>10 ก.ย. 2569 · 09.00–12.00 น.</span><p>รวม Sec 1–6</p></article>
      <article><b>IMPACT Site Visit</b><span>20 ต.ค. 2569</span><p>Thunder Dome · Exhibition Hall 9–10 · Royal Jubilee · Portal</p></article>
    </div></section>
  </div>
}

function App(){
  const [tab,setTab]=useState('home')
  const [sec,setSec]=useState(1)
  const [filter,setFilter]=useState('all')
  const [week,setWeek]=useState(null)
  const [picked,setPicked]=useState(null)

  const nav=[
    ['home','หน้าหลัก'],
    ['calendar','ปฏิทิน'],
    ['weeks','แผน 15 สัปดาห์'],
    ['sections','ตารางแต่ละ Sec'],
    ['project','Final Project'],
    ['assessment','คะแนนและการสอบ'],
    ['course','ข้อมูลรายวิชา'],
  ]

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">TE</div><div><b>TE101</b><span>Student Hub</span></div></div>
      <nav>{nav.map(([id,label])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}>{label}</button>)}</nav>
      <div className="sideFoot"><small>{course.semester}</small><b>สอบปลายภาค</b><span>3 ธ.ค. 2569 · 13.00–16.00</span></div>
    </aside>

    <main className="main">
      <header>
        <div><span className="eyebrow">{course.code}</span><h1>{course.name}</h1></div>
        <div className="studentBadge">STUDENT HUB</div>
      </header>

      {tab==='home'&&<div>
        <div className="hero">
          <div><span className="eyebrow">WELCOME TO TE101</span><h2>เรียนอุตสาหกรรมอีเว้นท์ ผ่านการลงมือทำจริง</h2><p>เรียนรู้พื้นฐานอุตสาหกรรม → พัฒนาแนวคิด → Bidding → วางแผน → จัด Public Event จริง → ประเมินผล</p></div>
          <div className="heroDate"><b>สอบปลายภาค</b><span>3 ธ.ค. 2569</span><strong>13.00–16.00 น.</strong></div>
        </div>

        <div className="stats">
          <article><b>15</b><span>สัปดาห์การเรียนรู้</span></article>
          <article><b>6</b><span>Sections</span></article>
          <article><b>1</b><span>Public Event / Section</span></article>
          <article><b>100</b><span>คะแนนเต็ม</span></article>
        </div>

        <h2 className="blockTitle">กิจกรรมสำคัญของภาคการศึกษา</h2>
        <div className="milestones">
          <article className="milestone guest"><span>10 ก.ย. 2569</span><h3>Guest Speaker</h3><b>09.00–12.00 น.</b><p>การบรรยายพิเศษรวม Sec 1–6</p></article>
          <article className="milestone midterm"><span>28 ก.ย.–2 ต.ค.</span><h3>สัปดาห์สอบกลางภาค</h3><b>TE101 ไม่มีสอบกลางภาค</b><p>Winning Project ปรับแนวคิดก่อนเริ่ม Production หลังสอบ</p></article>
          <article className="milestone visit"><span>20 ต.ค. 2569</span><h3>IMPACT Site Visit</h3><b>ศึกษาดูงานสถานที่จริง</b><p>Thunder Dome · Hall 9–10 · Royal Jubilee · Portal</p></article>
          <article className="milestone exam"><span>3 ธ.ค. 2569</span><h3>Final Exam</h3><b>13.00–16.00 น.</b><p>สอบปลายภาค TE101</p></article>
        </div>

        <div className="homeActions">
          <button onClick={()=>setTab('calendar')}><b>เปิดปฏิทิน</b><span>ดูวันเรียน กิจกรรม และวันสอบ</span></button>
          <button onClick={()=>setTab('project')}><b>ดู Final Project</b><span>ดู Timeline และสิ่งที่ต้องเตรียมสำหรับ Bidding</span></button>
          <button onClick={()=>setTab('sections')}><b>ดู Sec ของตัวเอง</b><span>เลือก Sec เพื่อดูวัน เวลา ห้อง และแผนรายสัปดาห์</span></button>
        </div>
      </div>}

      {tab==='calendar'&&<div>
        <div className="pageTitle rowTitle"><div><span className="eyebrow">CALENDAR</span><h2>ปฏิทินการเรียน กิจกรรม และการสอบ</h2><p className="calendarHint">แตะวันที่เพื่อดูรายละเอียด เวลา และกิจกรรมทั้งหมด</p></div>
          <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">ทุก Sec</option>{[1,2,3,4,5,6].map(s=><option value={s} key={s}>Sec {s}</option>)}</select>
        </div>
        <Calendar selectedSec={filter} onPick={setPicked}/>
      </div>}

      {tab==='weeks'&&<div>
        <div className="pageTitle"><span className="eyebrow">15 WEEKS</span><h2>แผนการเรียนตลอดภาคการศึกษา</h2><p>คลิกแต่ละสัปดาห์เพื่อดูหัวข้อสำคัญและงานที่เชื่อมโยงกับ Final Project</p></div>
        <div className="weekGrid">{weeks.map(w=><button className="weekCard" onClick={()=>setWeek(w)} key={w.week}><span>W{w.week}</span><small>{w.range}</small><h3>{w.theme}</h3><p>{w.content}</p></button>)}</div>
      </div>}

      {tab==='sections'&&<div>
        <div className="pageTitle rowTitle"><div><span className="eyebrow">SECTION</span><h2>ตารางเรียนตาม Section</h2></div><div className="secBtns">{[1,2,3,4,5,6].map(s=><button className={sec===s?'active':''} onClick={()=>setSec(s)} key={s}>Sec {s}</button>)}</div></div>
        <SectionView sec={sec}/>
      </div>}

      {tab==='project'&&<Project/>}
      {tab==='assessment'&&<Assessment/>}
      {tab==='course'&&<CourseInfo/>}

      <WeekModal w={week} onClose={()=>setWeek(null)}/>
      <DayDetail picked={picked} onClose={()=>setPicked(null)}/>
    </main>
  </div>
}

export default App

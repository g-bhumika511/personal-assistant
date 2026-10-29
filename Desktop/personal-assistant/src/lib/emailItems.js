const sourceNames = [
  'Outstanding items to be completed asap.eml',
  'Re_ Volunteering opportunity - Black History Month event with EDI.eml',
  'Reminder_ School of CS Research Seminar Series - today, Thursday 29th October - 2pm.eml',
  'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
  'Weekly Jobs & Opportunities Alert from the Career Development Centre.eml',
  'lab delay today_ 2627-CT5141 Optimisation.eml',
]

const makeItem = (item) => ({
  id: item.id,
  title: item.title,
  type: item.type,
  date: item.date ?? null,
  time: item.time ?? null,
  location: item.location ?? null,
  cost: item.cost ?? 'Unknown',
  action: item.action,
  priority: item.priority ?? 'Medium',
  urgencyReason: item.urgencyReason ?? 'Relevant to your student schedule.',
  evidence: item.evidence ?? null,
  image: item.image ?? null,
  link: item.link ?? null,
  source: item.source,
})

const items = [
  makeItem({
    id: 'computer-skills-workshop-2026-10-28',
    title: 'Computer Skills Workshop',
    type: 'Event',
    date: '2026-10-28',
    time: '18:00',
    location: 'CSB-1007',
    cost: 'Free',
    action: 'Bring your laptop and join the practical workshop.',
    priority: 'Low',
    urgencyReason: 'Past student workshop.',
    evidence: 'The weekly ezine lists a computer skills workshop at 6pm on Wednesday 28 October in CSB-1007, with free pizza afterwards.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    link: 'https://www.universityofgalway.ie/student-fees/',
  }),
  makeItem({
    id: 'marie-birkett-bursary-2026-11-06',
    title: 'Marie Birkett Bursary',
    type: 'Deadline',
    date: '2026-11-06',
    time: null,
    location: 'University of Galway',
    cost: 'Free',
    action: 'Check eligibility and apply for the €6,000 bursary.',
    priority: 'High',
    urgencyReason: 'Applications close on November 6, 2026.',
    evidence: 'The newsletter says this bursary supports a first-year student with care or kinship care experience and is worth €6,000.',
    link: 'https://universityofgalway.ie/access/scholarshipsfunds/mariebirkettbursary/',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
  }),
  makeItem({
    id: 'galway-wind-park-scholarship',
    title: 'Galway Wind Park scholarship',
    type: 'Announcement',
    date: null,
    time: null,
    location: null,
    cost: 'Paid',
    action: 'Check whether you live within 15km and apply for fee support.',
    priority: 'High',
    urgencyReason: 'Potentially covers 50% of third-level fees for up to three years.',
    evidence: 'The newsletter says students living within 15km of Galway Wind Park can apply for 50% funding support toward fees for up to three years.',
    link: 'https://www.universityofgalway.ie/undergraduate-scholarships/galwaywindparkscholarship/',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
  }),
  makeItem({
    id: 'scholarships-webpage',
    title: 'University of Galway scholarships webpage',
    type: 'Announcement',
    date: null,
    time: null,
    location: null,
    cost: 'Free',
    action: 'Browse available undergraduate and postgraduate scholarships.',
    priority: 'Medium',
    urgencyReason: 'Could reveal funding opportunities relevant to your studies.',
    link: 'https://www.universityofgalway.ie/scholarships/',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
  }),
  makeItem({
    id: 'sustainability-fund-2026-11-06',
    title: 'Sustainability Fund for Student Societies',
    type: 'Deadline',
    date: '2026-11-06',
    time: null,
    location: 'University of Galway',
    cost: 'Free',
    action: 'Submit a student society sustainability event idea for up to €500 support.',
    priority: 'Medium',
    urgencyReason: 'Applications close Friday November 6.',
    evidence: 'The newsletter says the Sustainability Office offers €500 awards for society sustainability ideas.',
    link: 'https://www.universityofgalway.ie/sustainability/studentsresources/societiessustainabilityfund/',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
  }),
  makeItem({
    id: 'engineers-talk-2026-10-28',
    title: 'What Do Engineers Do?',
    type: 'Event',
    date: '2026-10-28',
    time: '18:00',
    location: 'ENG-G018, Alice Perry Building',
    cost: 'Free',
    action: 'Join the engineering careers talk and Q&A.',
    priority: 'Low',
    urgencyReason: 'Past student careers event.',
    evidence: 'The weekly ezine lists this event at 6pm on Wednesday 28 October in ENG-G018.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    image: 'https://i6.cmail19.com/ei/r/E1/0F4/4D2/235105/csfinal/02f9d1833f714f0284fef39a9f48fc25-990000000003cf3c.jpg',
  }),
  makeItem({
    id: 'video-game-pub-quiz-2026-10-28',
    title: 'Video Game Society Pub Quiz',
    type: 'Event',
    date: '2026-10-28',
    time: '19:15',
    location: 'Busker Brownes, Cross Street',
    cost: 'Paid',
    action: 'Join a team if you bought a €5 ticket.',
    priority: 'Low',
    urgencyReason: 'Past optional social event.',
    evidence: 'The weekly ezine lists the pub quiz at 7:15pm on Wednesday 28 October at Busker Brownes; tickets cost €5.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    image: 'https://i7.cmail19.com/ei/r/E1/0F4/4D2/235105/csfinal/EzineEventsize24-2026-10-27T095802.249-990000000003cf3c.jpg',
  }),
  makeItem({
    id: 'cs-research-seminar-2026-10-29',
    title: 'CS Research Seminar: Deep Learning Algorithms for Pediatric Murmur Characterization',
    type: 'Event',
    date: '2026-10-29',
    time: '14:00',
    location: 'CSB-1005, 1st Floor, Computer Science Building',
    cost: 'Free',
    action: 'Attend the research seminar.',
    source: 'Reminder_ School of CS Research Seminar Series - today, Thursday 29th October - 2pm.eml',
  }),
  makeItem({
    id: 'black-history-month-volunteering-2026-10-29',
    title: 'Black History Month event volunteering',
    type: 'Event',
    date: '2026-10-29',
    time: '11:00',
    location: 'The View, then The Hub',
    cost: 'Free',
    action: 'Help with setup and redirect participants to The Hub.',
    source: 'Re_ Volunteering opportunity - Black History Month event with EDI.eml',
  }),
  makeItem({
    id: 'semester-fees-deadline-2026-10-31',
    title: 'Semester one fees payment deadline',
    type: 'Deadline',
    date: '2026-10-31',
    time: null,
    location: null,
    cost: 'Paid',
    action: 'Pay semester one fees before the deadline.',
    priority: 'High',
    urgencyReason: 'Financial deadline on October 31; late payment may incur a penalty.',
    evidence: 'The newsletter says semester one fees are due Saturday 31 October and a late payment penalty applies.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    image: 'https://i8.cmail19.com/ei/r/E1/0F4/4D2/235105/csfinal/PubQuizPoster2_1792422317_th-38c8db2c5d00de2a.jpeg',
  }),
  makeItem({
    id: 'society-outstanding-items-2026-10-31',
    title: 'Complete outstanding society questions and training',
    type: 'Deadline',
    date: '2026-10-31',
    time: null,
    location: null,
    cost: 'Free',
    action: 'Check the Supersoc spreadsheet and complete outstanding items.',
    priority: 'High',
    urgencyReason: 'Outstanding training must be completed before October 31.',
    evidence: 'The email asks committee members to complete outstanding questions or training by October 31.',
    source: 'Outstanding items to be completed asap.eml',
  }),
  makeItem({
    id: 'optimisation-lab-delay-2026-10-29',
    title: '2627-CT5141 Optimisation lab delay',
    type: 'Announcement',
    date: '2026-10-29',
    time: '10:00',
    location: null,
    cost: 'Free',
    action: 'Allow extra time: the teaching assistant will arrive later than usual.',
    priority: 'Medium',
    urgencyReason: 'This affects today’s 10am lab.',
    evidence: 'The course announcement says the teaching assistant is unavailable and will arrive later than normal.',
    source: 'lab delay today_ 2627-CT5141 Optimisation.eml',
  }),
  makeItem({
    id: 'career-opportunities',
    title: 'Career Development Centre jobs and opportunities',
    type: 'Interview',
    date: null,
    time: null,
    location: null,
    cost: 'Free',
    action: 'Review the listed jobs, internships, and training opportunities.',
    priority: 'Low',
    urgencyReason: 'Useful career opportunities, but no immediate deadline is stated.',
    evidence: 'The Career Development Centre alert lists jobs, internships, and training opportunities.',
    source: 'Weekly Jobs & Opportunities Alert from the Career Development Centre.eml',
  }),
  makeItem({
    id: 'black-history-month-ezine-2026-10-29',
    title: 'Celebrating Black History Month',
    type: 'Event',
    date: '2026-10-29',
    time: '11:00',
    location: 'The Hub, Áras na Mac Léinn',
    cost: 'Free',
    action: 'Attend the campus Black History Month event.',
    priority: 'High',
    urgencyReason: 'This is a same-day campus event with a fixed start time.',
    evidence: 'The weekly ezine lists this event from 11am to 2pm on Thursday 29 October at The Hub.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    image: 'https://i9.cmail19.com/ei/r/E1/0F4/4D2/235105/csfinal/BlackHistoryMonth8.jpg-6c33e783a9cd2120.jpg',
  }),
  makeItem({
    id: 'student-union-halloween-2026-10-29',
    title: 'Students’ Union Halloween event',
    type: 'Event',
    date: '2026-10-29',
    time: '20:00',
    location: 'University of Galway campus',
    cost: 'Free',
    action: 'Decide whether to attend the free-entry Halloween event.',
    priority: 'Low',
    urgencyReason: 'Optional evening event.',
    evidence: 'The weekly ezine says the Students’ Union Halloween event starts at 8pm on Thursday 29 October and has free entry.',
    source: 'Weekly Ezine - Ríomhiris na Seachtaine 27_10_26.eml',
    image: 'https://i10.cmail19.com/ei/r/E1/0F4/4D2/235105/csfinal/Screenshot2026-10-22151721-990000000003cf3c.png',
  }),
  makeItem({
    id: 'build-open-hack-day-2026-10-29',
    title: 'Build Open Hack Day',
    type: 'Event',
    date: '2026-10-29',
    time: '11:00',
    location: 'The Cube, Áras na Mac Léinn',
    cost: 'Free',
    action: 'Build and submit a project before the 3:30pm submission deadline.',
    priority: 'High',
    urgencyReason: 'Fixed one-day hackathon with project submissions closing at 3:30pm.',
    evidence: 'The event runs from 11am to 5pm on October 29; hacking begins at 12:15pm and submissions close at 3:30pm.',
    source: 'Build Open Hack Day email',
  }),
]

export const getInboxItems = () => items
export const getInboxSourceCount = () => sourceNames.length

export const getTodayKey = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export const getRelativeDateKey = (daysFromToday) => {
  const date = new Date(`${getTodayKey()}T00:00:00`)
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

export const formatDate = (date) => {
  if (!date) return 'Date to confirm'
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))
}

export const formatTime = (time) => {
  if (!time) return 'Time to confirm'
  return new Intl.DateTimeFormat('en-IE', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`2026-01-01T${time}`))
}

const escapeIcs = (value) => String(value ?? '').replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n')

export const downloadIcs = (item) => {
  if (!item.date) return

  const start = `${item.date.replaceAll('-', '')}T${(item.time ?? '09:00').replace(':', '')}00`
  const endDate = item.time ? new Date(`${item.date}T${item.time}`) : new Date(`${item.date}T10:00`)
  endDate.setHours(endDate.getHours() + 1)
  const end = endDate.toISOString().replaceAll('-', '').replaceAll(':', '').slice(0, 15) + '00'
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Quiet Desk//EN',
    'BEGIN:VEVENT',
    `UID:${item.id}@quiet-desk`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(item.title)}`,
    item.location ? `LOCATION:${escapeIcs(item.location)}` : null,
    `DESCRIPTION:${escapeIcs(item.action)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

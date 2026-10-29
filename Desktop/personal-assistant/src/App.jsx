import { useEffect, useMemo, useState } from 'react'
import {
  downloadIcs,
  formatDate,
  formatTime,
  getInboxItems,
  getInboxSourceCount,
  getRelativeDateKey,
  getTodayKey,
} from './lib/emailItems'
import './App.css'

const initialItems = getInboxItems()
const normalizeItem = (item) => ({
  ...item,
  type: item.type || 'Announcement',
  cost: item.cost || 'Unknown',
  priority: item.priority || 'Medium',
  urgencyReason: item.urgencyReason || 'Relevant to your student schedule.',
  action: item.action || 'Review this item.',
  decision: item.decision || null,
})
const mergeSavedItems = (savedItems) => {
  const savedById = new Map(savedItems.map((item) => [item.id, item]))
  return initialItems.map((item) => normalizeItem({ ...item, ...savedById.get(item.id), image: savedById.get(item.id)?.image || item.image }))
    .concat(savedItems.filter((item) => !initialItems.some((initialItem) => initialItem.id === item.id)).map(normalizeItem))
}

function ItemCard({ item, completed, onToggle }) {
  const [decision, setDecision] = useState(item.decision)
  const [imageFailed, setImageFailed] = useState(false)

  const choose = (value) => {
    setDecision(value)
    window.dispatchEvent(new CustomEvent('quiet-desk-decision', {
      detail: { id: item.id, decision: value },
    }))
  }

  return (
    <article className={`item-card ${completed ? 'is-completed' : ''}`}>
      <div className="item-heading">
        <span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>
        <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
        <span className={`cost cost-${item.cost.toLowerCase()}`}>{item.cost}</span>
      </div>
      <div className="item-title-row">
        <h3>{item.title}</h3>
        <button type="button" className={`complete-button ${completed ? 'completed' : ''}`} onClick={() => onToggle(item.id)} aria-label={`${completed ? 'Mark' : 'Complete'} ${item.title}`}>
          {completed ? '✓' : '○'}
        </button>
      </div>
      <dl>
        <div><dt>Date</dt><dd>{formatDate(item.date)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(item.time)}</dd></div>
        <div><dt>Where</dt><dd>{item.location ?? 'Location to confirm'}</dd></div>
      </dl>
      <p className="action"><strong>Next:</strong> {item.action}</p>
      <p className="reason"><strong>Why:</strong> {item.urgencyReason}</p>
      {item.image && !imageFailed && <img className="item-image" src={item.image} alt="" loading="eager" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />}
      {item.image && imageFailed && <div className="image-fallback" role="img" aria-label="Image unavailable">Image unavailable</div>}
      {item.evidence && <details className="evidence"><summary>Why Quiet Desk added this</summary><p>{item.evidence}</p></details>}
      {item.type === 'Event' && (
        <div className="decision-row" aria-label={`Decision for ${item.title}`}>
          <span className="decision-label">{decision ? `You chose ${decision}` : 'Should you attend?'}</span>
          <div>
            {['Attend', 'Maybe', 'Skip'].map((option) => (
              <button
                type="button"
                key={option}
                className={`decision-button ${decision === option ? 'selected' : ''}`}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" className="calendar-button" disabled={!item.date} onClick={() => downloadIcs(item)}>
        {item.date ? 'Add to calendar' : 'Needs a date first'}
      </button>
      {item.link && <a className="source-link" href={item.link} target="_blank" rel="noreferrer">Open source information</a>}
      <small>From {item.source}</small>
    </article>
  )
}

function conflictsFor(items) {
  return items.filter((item, index) => item.date && item.time && items.some((other, otherIndex) => (
    otherIndex !== index && other.date === item.date && other.time === item.time
  )))
}

function TimelineSection({ title, note, items, emptyMessage, completedIds, onToggle }) {
  return (
    <section className="timeline-section">
      <div className="timeline-heading">
        <div>
          <p className="eyebrow">{note}</p>
          <h3>{title}</h3>
        </div>
        <span className="timeline-count">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <div className="item-grid">{items.map((item) => <ItemCard key={item.id} item={item} completed={completedIds.has(item.id)} onToggle={onToggle} />)}</div>
      ) : (
        <p className="empty-message">{emptyMessage}</p>
      )}
    </section>
  )
}

const gameWords = ['FOCUS', 'CAMPUS', 'CALENDAR', 'BURSARY', 'MOMENTUM', 'QUIET', 'GALWAY']

function GamesLauncher() {
  const [open, setOpen] = useState(false)
  const [game, setGame] = useState('stars')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(20)
  const [playing, setPlaying] = useState(false)
  const [starPosition, setStarPosition] = useState({ top: 45, left: 50 })
  const [scramble, setScramble] = useState('')
  const [word, setWord] = useState('')
  const [guess, setGuess] = useState('')
  const [message, setMessage] = useState('')
  const [memoryCards, setMemoryCards] = useState([])
  const [flippedCards, setFlippedCards] = useState([])
  const [matchedCards, setMatchedCards] = useState([])
  const [breathPhase, setBreathPhase] = useState('Ready')
  const [breathing, setBreathing] = useState(false)

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPlaying(false)
          setMessage(`Time! You caught ${score} star${score === 1 ? '' : 's'}.`)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [playing, score])

  useEffect(() => {
    if (!breathing) return undefined
    const phases = ['Breathe in', 'Hold', 'Breathe out', 'Hold']
    let index = 0
    setBreathPhase(phases[index])
    const timer = window.setInterval(() => {
      index = (index + 1) % phases.length
      setBreathPhase(phases[index])
    }, 4000)
    return () => window.clearInterval(timer)
  }, [breathing])

  const startStars = () => {
    setScore(0)
    setTimeLeft(20)
    setMessage('Catch as many as you can!')
    setPlaying(true)
    setStarPosition({ top: 45, left: 50 })
  }

  const catchStar = () => {
    if (!playing) return
    setScore((current) => current + 1)
    setStarPosition({ top: 15 + Math.random() * 70, left: 10 + Math.random() * 80 })
  }

  const startWord = () => {
    const nextWord = gameWords[Math.floor(Math.random() * gameWords.length)]
    setWord(nextWord)
    setScramble(nextWord.split('').sort(() => Math.random() - 0.5).join(''))
    setGuess('')
    setMessage('Unscramble the letters.')
  }

  const submitGuess = (event) => {
    event.preventDefault()
    if (guess.trim().toUpperCase() === word) {
      setMessage('Nice! Try another one.')
      startWord()
    } else {
      setMessage('Not quite—try again.')
    }
  }

  const startMemory = () => {
    const symbols = ['☀', '☀', '☁', '☁', '☕', '☕', '✿', '✿']
    setMemoryCards(symbols.sort(() => Math.random() - 0.5).map((symbol, index) => ({ symbol, id: index })))
    setFlippedCards([])
    setMatchedCards([])
    setMessage('Find all four pairs.')
  }

  const flipMemoryCard = (id) => {
    if (flippedCards.length === 2 || flippedCards.includes(id) || matchedCards.includes(id)) return
    const nextFlipped = [...flippedCards, id]
    setFlippedCards(nextFlipped)
    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped.map((cardId) => memoryCards.find((card) => card.id === cardId))
      if (first.symbol === second.symbol) {
        setMatchedCards((current) => [...current, first.id, second.id])
        setFlippedCards([])
        if (matchedCards.length + 2 === memoryCards.length) setMessage('Perfect memory! Nice reset.')
      } else {
        window.setTimeout(() => setFlippedCards([]), 600)
      }
    }
  }

  return (
    <div className="games-widget">
      {open && (
        <section className="games-panel" aria-label="Little games">
          <div className="games-panel-heading">
            <div><span className="mini-label">TAKE A BREATHER</span><h2>Little games</h2></div>
            <button type="button" className="games-close" onClick={() => setOpen(false)} aria-label="Close games">×</button>
          </div>
          <div className="game-tabs">
            <button type="button" className={game === 'stars' ? 'active' : ''} onClick={() => { setGame('stars'); setPlaying(false); setBreathing(false); setMessage('') }}>✦ Catch stars</button>
            <button type="button" className={game === 'words' ? 'active' : ''} onClick={() => { setGame('words'); setPlaying(false); setBreathing(false); if (!word) startWord() }}>Aa Word mix</button>
            <button type="button" className={game === 'memory' ? 'active' : ''} onClick={() => { setGame('memory'); setPlaying(false); setBreathing(false); if (!memoryCards.length) startMemory() }}>◈ Memory</button>
            <button type="button" className={game === 'breathe' ? 'active' : ''} onClick={() => { setGame('breathe'); setPlaying(false); setBreathing(false); setBreathPhase('Ready') }}>◌ Breathe</button>
          </div>
          {game === 'stars' ? (
            <div className="star-game">
              <p>{playing ? `${timeLeft}s left · ${score} caught` : message || 'A tiny reset between tasks.'}</p>
              <div className="star-arena">
                {playing && <button type="button" className="star" style={{ top: `${starPosition.top}%`, left: `${starPosition.left}%` }} onClick={catchStar} aria-label="Catch star">✦</button>}
              </div>
              <button type="button" className="save-button game-action" onClick={startStars}>{playing ? 'Restart' : 'Start 20 seconds'}</button>
            </div>
          ) : game === 'words' ? (
            <div className="word-game">
              <p>{message || 'Rearrange the letters into a student-life word.'}</p>
              <strong className="scrambled-word">{scramble || '—'}</strong>
              <form onSubmit={submitGuess} className="word-form">
                <input value={guess} onChange={(event) => setGuess(event.target.value)} placeholder="Your answer" aria-label="Word answer" />
                <button type="submit" className="save-button">Check</button>
              </form>
              <button type="button" className="secondary-button" onClick={startWord}>New word</button>
            </div>
          ) : game === 'memory' ? (
            <div className="memory-game">
              <p>{message || 'Find all four pairs.'}</p>
              <div className="memory-grid">
                {memoryCards.map((card) => {
                  const visible = flippedCards.includes(card.id) || matchedCards.includes(card.id)
                  return <button type="button" key={card.id} className={`memory-card ${visible ? 'visible' : ''} ${matchedCards.includes(card.id) ? 'matched' : ''}`} onClick={() => flipMemoryCard(card.id)}>{visible ? card.symbol : '?'}</button>
                })}
              </div>
              <button type="button" className="secondary-button" onClick={startMemory}>New layout</button>
            </div>
          ) : (
            <div className="breathe-game">
              <p>A 16-second reset for your attention.</p>
              <div className={`breath-orb ${breathing ? 'breathing' : ''}`}><strong>{breathPhase}</strong><small>{breathing ? 'Follow the circle' : 'Ready when you are'}</small></div>
              <button type="button" className="save-button game-action" onClick={() => setBreathing(!breathing)}>{breathing ? 'Pause' : 'Start breathing'}</button>
            </div>
          )}
        </section>
      )}
      <button type="button" className={`games-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Open little games">
        <span>✦</span><small>{open ? 'Close' : 'Play'}</small>
      </button>
    </div>
  )
}

function GalwayNow({ todayItems }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('weather')
  const [weather, setWeather] = useState(null)
  const [weatherError, setWeatherError] = useState('')
  const [news, setNews] = useState(null)
  const [newsError, setNewsError] = useState('')

  useEffect(() => {
    if (!open || weather || weatherError) return undefined
    fetch('https://api.open-meteo.com/v1/forecast?latitude=53.2707&longitude=-9.0568&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FDublin')
      .then((response) => {
        if (!response.ok) throw new Error('Weather unavailable')
        return response.json()
      })
      .then(setWeather)
      .catch(() => setWeatherError('Weather is taking a moment to load.'))
  }, [open, weather, weatherError])

  useEffect(() => {
    if (!open || tab !== 'news' || news || newsError) return undefined
    fetch('/api/news')
      .then((response) => {
        if (!response.ok) throw new Error('News unavailable')
        return response.json()
      })
      .then((result) => setNews(result.items))
      .catch(() => setNewsError('News is taking a moment to load.'))
  }, [open, tab, news, newsError])

  const weatherLabel = (code) => {
    if (code === 0) return 'Clear'
    if (code <= 3) return 'Partly cloudy'
    if (code <= 48) return 'Misty'
    if (code <= 67) return 'Rain likely'
    if (code <= 77) return 'Showers or snow'
    return 'Unsettled'
  }
  const places = [
    { name: 'Galway City Museum', detail: 'A warm, easy culture stop by the Spanish Arch.' },
    { name: 'Salthill Promenade', detail: 'Best for a windy walk when the clouds break.' },
    { name: 'Galway Market', detail: 'A lively food stop near St Nicholas’ Church.' },
  ]

  return (
    <div className="galway-widget">
      {open && (
        <section className="galway-panel" aria-label="Galway today">
          <div className="games-panel-heading">
            <div><span className="mini-label">GALWAY NOW</span><h2>Today outside</h2></div>
            <button type="button" className="games-close" onClick={() => setOpen(false)} aria-label="Close Galway updates">×</button>
          </div>
          <div className="galway-tabs">
            {['weather', 'today', 'news'].map((section) => <button type="button" key={section} className={tab === section ? 'active' : ''} onClick={() => setTab(section)}>{section === 'weather' ? '☁ Weather' : section === 'today' ? '✦ Today' : '📰 News'}</button>)}
          </div>
          {tab === 'weather' && (weather ? (
            <div className="weather-card">
              <div><strong>{Math.round(weather.current.temperature_2m)}°C</strong><span>{weatherLabel(weather.current.weather_code)}</span></div>
              <p>Feels like {Math.round(weather.current.apparent_temperature)}° · Rain chance {weather.daily.precipitation_probability_max[0]}% · Wind {Math.round(weather.current.wind_speed_10m)} km/h</p>
            </div>
          ) : <p className="panel-status">{weatherError || 'Checking Galway weather…'}</p>)}
          {tab === 'today' && <>
            <h3 className="panel-section-title">Happening today</h3>
            {todayItems.length ? todayItems.slice(0, 3).map((item) => <div className="galway-event" key={item.id}><strong>{item.title}</strong><span>{item.time || 'All day'} · {item.location || 'Galway campus'}</span></div>) : <p className="panel-status">No events in your desk today.</p>}
            <h3 className="panel-section-title">Places to visit</h3>
            {places.map((place) => <div className="place-row" key={place.name}><strong>{place.name}</strong><span>{place.detail}</span></div>)}
          </>}
          {tab === 'news' && <div className="news-list">
            {!news && <p className="panel-status">{newsError || 'Checking the latest Galway headlines…'}</p>}
            {news?.map((item) => <article className="news-item" key={`${item.link}-${item.title}`}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}{item.published ? ` · ${new Date(item.published).toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' })}` : ''}</span></article>)}
            {news?.length === 0 && <p className="panel-status">No Galway headlines found right now.</p>}
          </div>}
          {tab !== 'news' && <small className="weather-note">Weather is a live estimate and can change quickly in Galway—check again before heading out.</small>}
        </section>
      )}
      <button type="button" className={`galway-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Open Galway today">
        <span>☁</span><small>{open ? 'Close' : 'Galway'}</small>
      </button>
    </div>
  )
}

function NewsCards({ news, loading, error, compact = false }) {
  if (loading) return <p className="panel-status">Checking the latest Galway headlines…</p>
  if (error) return <p className="panel-status">{error}</p>
  if (!news.length) return <p className="panel-status">No Galway headlines found right now.</p>

  return (
    <div className={`news-cards ${compact ? 'compact' : ''}`}>
      {news.slice(0, compact ? 3 : 8).map((item) => (
        <article className="news-card" key={`${item.link}-${item.title}`}>
          {item.image && <img className="news-card-image" src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
          <span className="news-card-source">{item.source}</span>
          <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
          {item.published && <time dateTime={item.published}>{new Date(item.published).toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' })}</time>}
        </article>
      ))}
    </div>
  )
}

function AiNewsBriefing({ news, loading, error, onRefresh, refreshing }) {
  const [category, setCategory] = useState('All')
  const [saved, setSaved] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiet-desk-ai-saved') || '[]')) } catch { return new Set() }
  })
  const categories = ['All', 'Research', 'Companies', 'Products', 'Updates']
  const filtered = category === 'All' ? news : news.filter((item) => item.category === category)
  const lead = filtered[0]

  useEffect(() => {
    localStorage.setItem('quiet-desk-ai-saved', JSON.stringify([...saved]))
  }, [saved])

  const toggleSaved = (link) => {
    setSaved((current) => {
      const next = new Set(current)
      next.has(link) ? next.delete(link) : next.add(link)
      return next
    })
  }

  if (loading) return <p className="panel-status">Building your AI briefing…</p>
  if (error) return <p className="panel-status">{error}</p>
  if (!news.length) return <p className="panel-status">No AI headlines found right now.</p>

  return (
    <div className="ai-briefing">
      <div className="ai-toolbar">
        <div className="category-pills">{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <button type="button" className="refresh-news" onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button>
      </div>
      {lead && <article className="ai-lead">
        {lead.image && <img src={lead.image} alt="" referrerPolicy="no-referrer" />}
        <div><span className="news-card-source">{lead.category} · {lead.source}</span><a href={lead.link} target="_blank" rel="noreferrer"><h3>{lead.title}</h3></a><p>Stay informed with a quick read from today’s AI landscape.</p><button type="button" className={`save-news ${saved.has(lead.link) ? 'saved' : ''}`} onClick={() => toggleSaved(lead.link)}>{saved.has(lead.link) ? '✓ Saved' : '☆ Save for later'}</button></div>
      </article>}
      <div className="ai-story-grid">
        {filtered.slice(1, 8).map((item) => <article className="ai-story" key={item.link}>
          {item.image && <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
          <div><span className="news-card-source">{item.category}</span><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><div className="story-footer"><small>{item.source}</small><button type="button" className={saved.has(item.link) ? 'saved' : ''} onClick={() => toggleSaved(item.link)} aria-label={`${saved.has(item.link) ? 'Remove' : 'Save'} ${item.title}`}>{saved.has(item.link) ? '✓' : '☆'}</button></div></div>
        </article>)}
      </div>
      {saved.size > 0 && <p className="saved-news-count">☆ {saved.size} article{saved.size === 1 ? '' : 's'} saved for later</p>}
    </div>
  )
}

const dsaExercises = [
  {
    id: 'two-sum',
    level: 'Easy',
    topic: 'Hash map',
    title: 'Two Sum',
    prompt: 'Given an array of integers and a target, return the indices of two numbers that add up to the target.',
    example: 'nums = [2, 7, 11, 15], target = 9 → [0, 1]',
    hint: 'As you scan the array, ask whether target - current has already been seen.',
    solution: 'Use a hash map from value to index. For each number, check its complement before storing it. This gives O(n) time and O(n) space.',
  },
  {
    id: 'valid-parentheses',
    level: 'Easy',
    topic: 'Stack',
    title: 'Valid Parentheses',
    prompt: 'Given a string containing (), {}, and [], determine whether the brackets are correctly matched and nested.',
    example: 's = "{[]}" → true',
    hint: 'Store opening brackets and compare each closing bracket with the most recent opening bracket.',
    solution: 'Push opening brackets onto a stack. For each closer, verify it matches the stack top, then pop. The stack must be empty at the end.',
  },
  {
    id: 'best-time-stock',
    level: 'Easy',
    topic: 'Arrays',
    title: 'Best Time to Buy and Sell Stock',
    prompt: 'Given daily stock prices, find the maximum profit from buying once and selling later.',
    example: 'prices = [7, 1, 5, 3, 6, 4] → 5',
    hint: 'Keep the lowest price seen so far and the best profit so far.',
    solution: 'Track a running minimum and update profit with price - minimum on every day. This is O(n) time and O(1) space.',
  },
  {
    id: 'binary-search',
    level: 'Medium',
    topic: 'Binary search',
    title: 'Binary Search',
    prompt: 'Given a sorted array and a target, return its index or -1 if it is not present.',
    example: 'nums = [-1, 0, 3, 5, 9, 12], target = 9 → 4',
    hint: 'Discard half of the remaining search range after every comparison.',
    solution: 'Use left and right pointers. Compare the middle value and move one pointer inward until the target is found or the range is empty.',
  },
]

function InterviewPrep() {
  const [selectedId, setSelectedId] = useState(dsaExercises[0].id)
  const [answer, setAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [solved, setSolved] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiet-desk-dsa-solved') || '[]')) } catch { return new Set() }
  })
  const exercise = dsaExercises.find((item) => item.id === selectedId) || dsaExercises[0]

  useEffect(() => {
    localStorage.setItem('quiet-desk-dsa-solved', JSON.stringify([...solved]))
  }, [solved])

  const chooseExercise = (id) => {
    setSelectedId(id)
    setAnswer('')
    setShowHint(false)
    setShowSolution(false)
  }

  const toggleSolved = () => {
    setSolved((current) => {
      const next = new Set(current)
      next.has(exercise.id) ? next.delete(exercise.id) : next.add(exercise.id)
      return next
    })
  }

  return (
    <section className="interview-page">
      <div className="interview-hero">
        <div>
          <p className="eyebrow">Interview prep studio</p>
          <h2>Build your DSA confidence.</h2>
          <p>Practice one pattern at a time, then take your momentum to LeetCode.</p>
        </div>
        <a className="leetcode-button" href="https://leetcode.com/problemset/" target="_blank" rel="noreferrer">Open LeetCode ↗</a>
      </div>
      <div className="interview-progress">
        <span><strong>{solved.size}</strong> / {dsaExercises.length} solved</span>
        <div><i style={{ width: `${(solved.size / dsaExercises.length) * 100}%` }} /></div>
        <span>{Math.round((solved.size / dsaExercises.length) * 100)}%</span>
      </div>
      <div className="interview-layout">
        <aside className="exercise-list" aria-label="DSA exercises">
          <p className="mini-label">PICK A PATTERN</p>
          {dsaExercises.map((item) => <button type="button" className={selectedId === item.id ? 'selected' : ''} key={item.id} onClick={() => chooseExercise(item.id)}>
            <span className="exercise-check">{solved.has(item.id) ? '✓' : item.level === 'Medium' ? '◆' : '○'}</span>
            <span><strong>{item.title}</strong><small>{item.topic} · {item.level}</small></span>
          </button>)}
        </aside>
        <article className="exercise-workspace">
          <div className="exercise-meta"><span className={`level-${exercise.level.toLowerCase()}`}>{exercise.level}</span><span>{exercise.topic}</span></div>
          <h3>{exercise.title}</h3>
          <p className="exercise-prompt">{exercise.prompt}</p>
          <code className="exercise-example">{exercise.example}</code>
          <label htmlFor="dsa-answer">Your approach</label>
          <textarea id="dsa-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows="6" placeholder="Describe your approach, complexity, or write pseudocode here..." />
          <div className="exercise-actions">
            <button type="button" className={`solve-button ${solved.has(exercise.id) ? 'solved' : ''}`} onClick={toggleSolved}>{solved.has(exercise.id) ? '✓ Solved' : 'Mark solved'}</button>
            <button type="button" className="secondary-button" onClick={() => setShowHint(!showHint)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
            <button type="button" className="secondary-button" onClick={() => setShowSolution(!showSolution)}>{showSolution ? 'Hide solution' : 'Reveal solution'}</button>
          </div>
          {showHint && <p className="study-note"><strong>Hint:</strong> {exercise.hint}</p>}
          {showSolution && <p className="study-note solution"><strong>Solution idea:</strong> {exercise.solution}</p>}
        </article>
      </div>
    </section>
  )
}

const cvChecks = [
  { key: 'contact', label: 'Contact details', points: 15, test: (text) => /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text) && /(?:\+353|0[1-9]\d{7,9}|\bphone\b|\bmobile\b)/i.test(text), tip: 'Add a professional email address and an Irish-format phone number.' },
  { key: 'summary', label: 'Profile summary', points: 10, test: (text) => /\b(profile|summary|about me|objective)\b/i.test(text), tip: 'Add a 3–4 line profile tailored to the role.' },
  { key: 'experience', label: 'Relevant experience', points: 20, test: (text) => /\b(experience|employment|work history|internship)\b/i.test(text), tip: 'Use achievement-led bullets with outcomes, not only responsibilities.' },
  { key: 'education', label: 'Education', points: 15, test: (text) => /\b(education|degree|university|college|bachelor|master|phd)\b/i.test(text), tip: 'Include your degree, institution, dates, and relevant modules.' },
  { key: 'skills', label: 'Skills and keywords', points: 15, test: (text) => /\b(skills|technologies|technical|java|python|javascript|sql|react)\b/i.test(text), tip: 'Mirror important skills from the job description naturally.' },
  { key: 'achievements', label: 'Quantified impact', points: 10, test: (text) => /\b\d+%|\b\d+\+|\b(?:increased|reduced|saved|grew|improved)\b/i.test(text), tip: 'Add numbers: users supported, time saved, performance improved, or scale.' },
  { key: 'structure', label: 'ATS-friendly structure', points: 10, test: (text) => text.length >= 1200 && !/[\u25a0\u25aa\u25cf]/.test(text), tip: 'Use clear headings, simple bullets, and a readable one-column layout.' },
  { key: 'irish', label: 'Ireland-ready details', points: 5, test: (text) => /\b(dublin|galway|cork|ireland|leinster|munster|connacht|visa|stamp \d)\b/i.test(text), tip: 'Add your location and, if relevant, work permission or visa status.' },
]

function CvScore() {
  const [cvText, setCvText] = useState(() => localStorage.getItem('quiet-desk-cv-text') || '')
  const [scoredText, setScoredText] = useState(() => localStorage.getItem('quiet-desk-cv-text') || '')
  const [role, setRole] = useState('')
  const [fileMessage, setFileMessage] = useState('')
  const checks = cvChecks.map((check) => ({ ...check, passed: check.test(scoredText) }))
  const score = scoredText.trim() ? checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0) : 0
  const passed = checks.filter((check) => check.passed)
  const suggestions = checks.filter((check) => !check.passed).slice(0, 4)

  const scoreCv = () => {
    if (!cvText.trim()) {
      setScoredText('')
      setFileMessage('Paste your CV text before scoring it.')
      return
    }
    setScoredText(cvText.trim())
    setFileMessage('CV scored locally')
  }

  const readFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!/\.(txt|md|text)$/i.test(file.name)) {
      setFileMessage(`${file.name} selected. PDF and DOCX text extraction is not available yet — copy the CV text into the box below, then press Score my CV.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setCvText(text)
      setScoredText(text.trim())
      setFileMessage(`${file.name} loaded`)
    }
    reader.onerror = () => setFileMessage('Could not read that file. Try pasting the CV text.')
    reader.readAsText(file)
  }

  useEffect(() => {
    localStorage.setItem('quiet-desk-cv-text', cvText)
  }, [cvText])

  return (
    <section className="cv-page">
      <div className="cv-hero">
        <div><p className="eyebrow">Career toolkit</p><h2>Make your CV easier to find.</h2><p>Private, practical ATS feedback shaped for applications in Ireland.</p></div>
        <div className="cv-score-ring"><strong>{score}</strong><span>/100 ATS</span></div>
      </div>
      <div className="cv-input-grid">
        <div className="cv-input-card">
          <label className="upload-cv"><span>Upload text CV (.txt, .md)</span><input type="file" accept=".txt,.md,.text" onChange={readFile} /></label>
          <label htmlFor="target-role">Target role <input id="target-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Graduate Software Engineer" /></label>
          <label htmlFor="cv-text">Paste your CV text</label>
          <textarea id="cv-text" value={cvText} onChange={(event) => {
            const text = event.target.value
            setCvText(text)
            setScoredText(text.trim())
            setFileMessage('')
          }} rows="13" placeholder="Paste the plain text of your CV here…" />
          <button type="button" className="score-cv-button" onClick={scoreCv}>Score my CV</button>
          <small className="privacy-note">Your CV is scored locally in this browser and is not sent to a server.</small>
          {fileMessage && <p className="panel-status">{fileMessage}{scoredText ? ` — ${score}/100` : ''}</p>}
        </div>
        <div className="cv-results">
          <div className="cv-result-heading"><div><span className="mini-label">ATS SNAPSHOT</span><h3>{score >= 75 ? 'Strong foundation' : score >= 50 ? 'Good start' : 'Room to improve'}</h3></div><span className="cv-word-count">{cvText.trim() ? cvText.trim().split(/\s+/).length : 0} words</span></div>
          {role && <p className="target-note">Tailoring for <strong>{role}</strong></p>}
          <div className="cv-checks">{checks.map((check) => <div className="cv-check" key={check.key}><span className={check.passed ? 'pass' : 'miss'}>{check.passed ? '✓' : '○'}</span><div><strong>{check.label}</strong><small>{check.points} points</small></div></div>)}</div>
          {scoredText && <div className="cv-suggestions"><span className="mini-label">QUICK WINS</span>{suggestions.length ? suggestions.map((item) => <p key={item.key}>→ {item.tip}</p>) : <p>Great coverage. Tailor keywords to each job description before applying.</p>}</div>}
          {!scoredText && <p className="cv-empty">Add your CV text, then press <strong>Score my CV</strong> to see your ATS feedback.</p>}
        </div>
      </div>
    </section>
  )
}

function FocusSession({ items, completedIds, mood, onComplete }) {
  const candidates = items.filter((item) => !completedIds.has(item.id))
  const [selectedId, setSelectedId] = useState(candidates[0]?.id || '')
  const [duration, setDuration] = useState(25)
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quiet-desk-focus-session') || 'null') } catch { return null }
  })
  const [remaining, setRemaining] = useState(() => session ? Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000)) : 0)
  const selectedItem = items.find((item) => item.id === (session?.itemId || selectedId))
  const moodCopy = mood === 'tired' || mood === 'stressed'
    ? 'Keep it gentle. One small step is enough.'
    : mood === 'focused' || mood === 'happy'
      ? 'You have good momentum. Let’s use it.'
      : 'A quiet, focused block for one meaningful task.'

  useEffect(() => {
    if (!session) return undefined
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000))
      setRemaining(next)
      if (next === 0) {
        setSession(null)
        localStorage.removeItem('quiet-desk-focus-session')
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  const startSession = () => {
    if (!selectedId) return
    const nextSession = { itemId: selectedId, endsAt: Date.now() + duration * 60 * 1000 }
    setSession(nextSession)
    setRemaining(duration * 60)
    localStorage.setItem('quiet-desk-focus-session', JSON.stringify(nextSession))
  }

  const stopSession = () => {
    setSession(null)
    setRemaining(0)
    localStorage.removeItem('quiet-desk-focus-session')
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0')
  const seconds = String(remaining % 60).padStart(2, '0')

  return (
    <section className={`focus-session ${session ? 'active' : ''}`} aria-label="Focus session">
      <div className="focus-session-copy">
        <span className="mini-label">FOCUS SESSION</span>
        <h3>{session ? 'You’re in the zone.' : 'Make a little room to focus.'}</h3>
        <p>{session ? moodCopy : 'Choose one task and give it your full attention.'}</p>
      </div>
      {session ? (
        <div className="focus-running">
          <div className="focus-timer" aria-live="polite">{minutes}:{seconds}</div>
          <strong>{selectedItem?.title || 'Selected task'}</strong>
          <div className="focus-actions">
            <button type="button" className="save-button" onClick={() => onComplete(session.itemId)}>Mark complete</button>
            <button type="button" className="secondary-button" onClick={stopSession}>End session</button>
          </div>
        </div>
      ) : candidates.length ? (
        <div className="focus-setup">
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Focus task">
            {candidates.slice(0, 12).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
          <div className="duration-buttons">
            {[5, 25, 45].map((minutesOption) => <button type="button" key={minutesOption} className={duration === minutesOption ? 'selected' : ''} onClick={() => setDuration(minutesOption)}>{minutesOption} min</button>)}
          </div>
          <button type="button" className="save-button" onClick={startSession}>Start focus</button>
        </div>
      ) : <p className="focus-empty">Your inbox is clear. Enjoy the breathing room.</p>}
    </section>
  )
}

function speakFriendly(text, rate = 0.92, pitch = 1.12) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const voices = window.speechSynthesis.getVoices()
  const speak = () => {
    const availableVoices = window.speechSynthesis.getVoices()
    const englishVoices = availableVoices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
    const feminineNames = /samantha|victoria|karen|moira|susan|zira|ava|siri|female|libby|hazel|saoirse/i
    const preferredVoice = englishVoices.find((voice) => feminineNames.test(voice.name))
      || englishVoices.find((voice) => voice.lang.toLowerCase() === 'en-ie')
      || englishVoices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb'))
      || englishVoices[0]
    const utterance = new SpeechSynthesisUtterance(text)
    if (preferredVoice) utterance.voice = preferredVoice
    utterance.lang = preferredVoice?.lang || 'en-IE'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 0.95
    window.speechSynthesis.speak(utterance)
  }
  if (voices.length) speak()
  else window.setTimeout(speak, 120)
}

function VoiceAssistant({ onAsk, lastAnswer, planning }) {
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript
      setTranscript(text)
      onAsk(text)
    }
    recognition.onerror = () => setSupported(false)
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  useEffect(() => {
    if (!lastAnswer || !window.speechSynthesis) return
    if (lastAnswer.includes('User question:') || lastAnswer.includes('Constraints:') || lastAnswer.includes('Draft 1')) return
    speakFriendly(lastAnswer)
  }, [lastAnswer])

  return (
    <div className="voice-widget">
      {open && (
        <section className="voice-panel" aria-label="Voice assistant">
          <div className="games-panel-heading">
            <div><span className="mini-label">VOICE DESK</span><h2>Talk to Quiet Desk</h2></div>
            <button type="button" className="games-close" onClick={() => setOpen(false)} aria-label="Close voice assistant">×</button>
          </div>
          <p className="voice-help">Ask things like “What should I do first?” or “Should I attend the Halloween event?”</p>
          {!supported ? <p className="panel-status">Voice input is not supported in this browser. Try Chrome or Edge.</p> : (
            <button type="button" className={`voice-listen ${listening ? 'listening' : ''}`} onClick={startListening} disabled={planning}>
              <span>{listening ? '●' : '🎙'}</span>{listening ? 'Listening…' : planning ? 'Thinking…' : 'Tap to speak'}
            </button>
          )}
          {transcript && <p className="voice-transcript"><strong>You said:</strong> {transcript}</p>}
          {lastAnswer && <p className="voice-answer"><strong>Quiet Desk:</strong> {lastAnswer}</p>}
        </section>
      )}
      <button type="button" className={`voice-launcher ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Open voice assistant">
        <span>🎙</span><small>{open ? 'Close' : 'Voice'}</small>
      </button>
    </div>
  )
}

function WelcomeScreen({ onEnter }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true)
      window.setTimeout(onEnter, 550)
    }, 2200)
    return () => window.clearTimeout(timer)
  }, [onEnter])

  const enterDesk = () => {
    setLeaving(true)
    if (window.speechSynthesis) {
      speakFriendly('Welcome to Quiet Desk. Let’s make room for what matters.', 0.88, 1.16)
    }
    window.setTimeout(onEnter, 550)
  }

  return (
    <div className={`welcome-screen ${leaving ? 'leaving' : ''}`} role="dialog" aria-label="Welcome to Quiet Desk">
      <div className="welcome-orbit orbit-one" />
      <div className="welcome-orbit orbit-two" />
      <div className="welcome-content">
        <div className="welcome-mark">✦</div>
        <p className="eyebrow">A calmer place for your day</p>
        <h2>Welcome to<br /><span>Quiet Desk</span></h2>
        <p className="welcome-copy">Your inbox, gently turned into a plan.</p>
        <button type="button" className="welcome-enter" onClick={enterDesk}>
          <span>Open Quiet Desk</span><strong>→</strong>
        </button>
        <small>Opening your calm workspace…</small>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState('today')
  const [welcomeVisible, setWelcomeVisible] = useState(true)
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('quiet-desk-items')
    try {
      if (!saved) return initialItems
      const savedItems = JSON.parse(saved).map(normalizeItem)
      return mergeSavedItems(savedItems)
    } catch {
      return initialItems
    }
  })
  const [savedMessage, setSavedMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [question, setQuestion] = useState('Plan my day and tell me what to do first.')
  const [planning, setPlanning] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [lastVoiceAnswer, setLastVoiceAnswer] = useState('')
  const [completedIds, setCompletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('quiet-desk-completed') || '[]')) } catch { return new Set() }
  })
  const [search, setSearch] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const [energy, setEnergy] = useState('steady')
  const moodOptions = [
    { key: 'calm', emoji: '😌', label: 'Calm', message: 'A clear moment is perfect for one thoughtful task.', energy: 'steady' },
    { key: 'happy', emoji: '✨', label: 'Bright', message: 'Use the good momentum for something meaningful.', energy: 'high' },
    { key: 'tired', emoji: '🌙', label: 'Tired', message: 'Let’s protect your energy: one tiny win is enough.', energy: 'low' },
    { key: 'stressed', emoji: '🌧️', label: 'Stretched', message: 'We’ll make the next step smaller and more manageable.', energy: 'low' },
    { key: 'focused', emoji: '🎯', label: 'Focused', message: 'You have a window for deep work. Let’s use it well.', energy: 'high' },
  ]
  const [mood, setMood] = useState(() => localStorage.getItem('quiet-desk-mood') || '')
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsError, setNewsError] = useState('')
  const [aiNews, setAiNews] = useState([])
  const [aiNewsLoading, setAiNewsLoading] = useState(false)
  const [aiNewsError, setAiNewsError] = useState('')
  const [aiNewsRefresh, setAiNewsRefresh] = useState(0)

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !query || [item.title, item.type, item.location, item.action].some((value) => value?.toLowerCase().includes(query))
      const matchesFocus = !focusMode || (!completedIds.has(item.id) && (item.priority === 'High' || item.date === getTodayKey()))
      return matchesSearch && matchesFocus
    })
  }, [items, search, focusMode, completedIds])
  const todayItems = useMemo(() => visibleItems.filter((item) => item.date === getTodayKey()), [visibleItems])
  const tomorrowItems = useMemo(() => visibleItems.filter((item) => item.date === getRelativeDateKey(1)), [visibleItems])
  const laterItems = useMemo(() => visibleItems.filter((item) => item.date && item.date > getRelativeDateKey(1)), [visibleItems])
  const undatedItems = useMemo(() => visibleItems.filter((item) => !item.date), [visibleItems])
  const conflicts = useMemo(() => conflictsFor(todayItems), [todayItems])
  const planItems = useMemo(() => {
    const today = new Date(`${getTodayKey()}T00:00:00`)
    const end = new Date(today)
    end.setDate(end.getDate() + 7)
    return visibleItems
      .filter((item) => item.date)
      .filter((item) => {
        const date = new Date(`${item.date}T00:00:00`)
        return date >= today && date < end
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [visibleItems])
  const groupedPlan = useMemo(() => planItems.reduce((groups, item) => {
    groups[item.date] ??= []
    groups[item.date].push(item)
    return groups
  }, {}), [planItems])

  useEffect(() => {
    localStorage.setItem('quiet-desk-items', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('quiet-desk-completed', JSON.stringify([...completedIds]))
  }, [completedIds])

  useEffect(() => {
    if (mood) localStorage.setItem('quiet-desk-mood', mood)
  }, [mood])

  useEffect(() => {
    setNewsLoading(true)
    fetch('/api/news')
      .then((response) => {
        if (!response.ok) throw new Error('News is temporarily unavailable.')
        return response.json()
      })
      .then((result) => setNews(result.items ?? []))
      .catch((fetchError) => setNewsError(fetchError.message))
      .finally(() => setNewsLoading(false))
  }, [])

  useEffect(() => {
    setAiNewsLoading(true)
    fetch('/api/news?category=ai')
      .then((response) => {
        if (!response.ok) throw new Error('AI news is temporarily unavailable.')
        return response.json()
      })
      .then((result) => setAiNews(result.items ?? []))
      .catch((fetchError) => setAiNewsError(fetchError.message))
      .finally(() => setAiNewsLoading(false))
  }, [aiNewsRefresh])

  const toggleCompleted = (id) => {
    setCompletedIds((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const completedCount = items.filter((item) => completedIds.has(item.id)).length
  const highPriorityCount = items.filter((item) => item.priority === 'High' && !completedIds.has(item.id)).length
  const nextAction = [...items]
    .filter((item) => !completedIds.has(item.id) && item.date && item.date >= getTodayKey())
    .sort((a, b) => `${a.date}${a.time || '99:99'}`.localeCompare(`${b.date}${b.time || '99:99'}`))[0]
  const selectedMood = moodOptions.find((option) => option.key === mood)

  const chooseMood = (option) => {
    setMood(option.key)
    setEnergy(option.energy)
  }

  useEffect(() => {
    const handleDecision = (event) => {
      setItems((current) => current.map((item) => item.id === event.detail.id
        ? { ...item, decision: event.detail.decision }
        : item))
    }
    window.addEventListener('quiet-desk-decision', handleDecision)
    return () => window.removeEventListener('quiet-desk-decision', handleDecision)
  }, [])

  const saveItems = () => {
    localStorage.setItem('quiet-desk-items', JSON.stringify(items))
    setSavedMessage('Saved for offline use')
    window.setTimeout(() => setSavedMessage(''), 2500)
  }

  useEffect(() => {
    fetch('/api/auth/status')
      .then((response) => response.json())
      .then((result) => setConnected(result.connected))
      .catch(() => setConnected(false))
  }, [])

  const extractMessages = async (messages) => {
    const extracted = await Promise.all(messages.map(async (message) => {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: message.body, source: message.source || message.subject || message.id }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to extract an email.')
      return result.items
    }))
    return extracted.flat()
  }

  const refreshGmail = async () => {
    setRefreshing(true)
    setError('')
    try {
      const messagesResponse = await fetch('/api/gmail/messages')
      const messagesResult = await messagesResponse.json()
      if (!messagesResponse.ok) throw new Error(messagesResult.error ?? 'Unable to read Gmail.')
      const extracted = await extractMessages(messagesResult.messages.map((message) => ({
        ...message,
        source: `Gmail: ${message.subject || message.id}`,
        body: `Subject: ${message.subject}\nDate: ${message.date}\n\n${message.body}`,
      })))
      const merged = [...items.filter((item) => !item.source?.startsWith('Gmail:')), ...extracted]
      setItems(merged)
      setSavedMessage(`Updated from ${messagesResult.messages.length} Gmail messages`)
    } catch (refreshError) {
      setError(refreshError.message)
    } finally {
      setRefreshing(false)
    }
  }

  const readLocalInbox = async () => {
    setRefreshing(true)
    setError('')
    try {
      const response = await fetch('/api/inbox')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to read the local inbox.')
      const extracted = await extractMessages(result.messages)
      setItems([...items.filter((item) => !item.source?.startsWith('Local inbox:')), ...extracted])
      setSavedMessage(`Read ${result.messages.length} local emails`)
    } catch (readError) {
      setError(readError.message)
    } finally {
      setRefreshing(false)
    }
  }

  const askPlannerQuestion = async (userMessage) => {
    if (!userMessage) return
    setPlanning(true)
    setError('')
    setChatMessages((messages) => [...messages, { role: 'user', text: userMessage }])
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, items, history: chatMessages }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Unable to plan your tasks.')
      const answer = result.answer.includes('User question:') || result.answer.includes('Constraints:')
        ? 'I’m ready to help. What would you like to plan first?'
        : result.answer
      setChatMessages((messages) => [...messages, { role: 'assistant', text: answer }])
      setLastVoiceAnswer(answer)
    } catch (planningError) {
      setError(planningError.message)
    } finally {
      setPlanning(false)
    }
  }

  const askPlanner = async (event) => {
    event.preventDefault()
    await askPlannerQuestion(question.trim())
  }

  return (
    <>
      {welcomeVisible && <WelcomeScreen onEnter={() => setWelcomeVisible(false)} />}
      <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Quiet Desk <span>•</span> student inbox</p>
          <h1>Make room for what matters.</h1>
          <p className="intro">A calm list of the events, deadlines and announcements hiding in your email.</p>
        </div>
        <div className="save-area">
          {connected ? (
            <>
              <button type="button" className="save-button" onClick={refreshGmail} disabled={refreshing}>
                {refreshing ? 'Reading Gmail…' : 'Refresh Gmail'}
              </button>
              <a className="account-link" href="/api/auth/logout">Disconnect Gmail</a>
            </>
          ) : (
            <a className="save-button" href="/api/auth/google">Connect Gmail</a>
          )}
          <button type="button" className="save-button" onClick={saveItems}>Save offline</button>
          <button type="button" className="secondary-button" onClick={readLocalInbox} disabled={refreshing}>Read local inbox</button>
          {savedMessage && <span className="saved-message" role="status">{savedMessage}</span>}
        </div>
      </header>

      <nav className="tabs" aria-label="Views">
        <button type="button" className={view === 'today' ? 'active' : ''} onClick={() => setView('today')}>Today <span>{todayItems.length}</span></button>
        <button type="button" className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}>Plan <span>{planItems.length}</span></button>
        <button type="button" className={view === 'news' ? 'active' : ''} onClick={() => setView('news')}>News <span>{news.length || '—'}</span></button>
        <button type="button" className={view === 'ai-news' ? 'active' : ''} onClick={() => setView('ai-news')}>AI & Tech <span>{aiNews.length || '—'}</span></button>
        <button type="button" className={view === 'interview' ? 'active' : ''} onClick={() => setView('interview')}>Interview prep <span>DSA</span></button>
        <button type="button" className={view === 'cv-score' ? 'active' : ''} onClick={() => setView('cv-score')}>CV score <span>ATS</span></button>
      </nav>

      <section className="view-header">
        <div>
          <p className="eyebrow">{view === 'today' ? formatDate(getTodayKey()) : view === 'plan' ? 'The week ahead' : view === 'news' ? 'Live local headlines' : view === 'ai-news' ? 'Research, companies and launches' : view === 'interview' ? 'Your next opportunity' : 'Career toolkit'}</p>
          <h2>{view === 'today' ? 'Your day, at a glance.' : view === 'plan' ? 'Seven days, gently organised.' : view === 'news' ? 'What’s happening in Galway' : view === 'ai-news' ? 'The AI world, in one calm feed.' : view === 'interview' ? 'Prepare with purpose.' : 'Make your CV stand out.'}</h2>
        </div>
        {view !== 'interview' && <p className="source-note">{getInboxSourceCount()} real emails read from <code>inbox/</code></p>}
      </section>
      {view !== 'news' && view !== 'ai-news' && view !== 'interview' && view !== 'cv-score' && <section className="headline-strip" aria-label="Top Galway news">
        <div className="headline-strip-heading">
          <div><p className="eyebrow">Galway briefing</p><h3>Top 3 today</h3></div>
          <button type="button" className="text-button" onClick={() => setView('news')}>See all news →</button>
        </div>
        <NewsCards news={news} loading={newsLoading} error={newsError} compact />
      </section>}
      {view === 'today' && <FocusSession items={items} completedIds={completedIds} mood={mood} onComplete={(id) => { toggleCompleted(id); setSavedMessage('Focus session completed') }} />}
      <section className="focus-cockpit" aria-label="Focus cockpit">
        <div className="focus-score">
          <div className="score-ring"><strong>{Math.round((completedCount / Math.max(items.length, 1)) * 100)}%</strong><span>clear</span></div>
          <div><p className="eyebrow">Your momentum</p><h3>{completedCount ? 'You are moving forward.' : 'A fresh start is a good start.'}</h3><p>{completedCount} of {items.length} inbox signals cleared today.</p></div>
        </div>
        <div className="next-action">
          <span className="mini-label">NEXT BEST ACTION</span>
          <strong>{nextAction?.title || 'Your desk is clear'}</strong>
          {nextAction && <small>{nextAction.date === getTodayKey() ? 'Today' : formatDate(nextAction.date)} · {nextAction.action}</small>}
        </div>
        <div className="energy-check">
          <span className="mini-label">HOW IS YOUR ENERGY?</span>
          <div>
            {['low', 'steady', 'high'].map((level) => <button type="button" className={energy === level ? 'selected' : ''} key={level} onClick={() => setEnergy(level)}>{level === 'low' ? '🌿 Gentle' : level === 'steady' ? '☕ Steady' : '⚡ Deep work'}</button>)}
          </div>
        </div>
      </section>
      <section className={`mood-checkin ${mood ? 'mood-selected' : ''}`} aria-label="Mood check-in">
        <div className="mood-copy">
          <span className="mini-label">DESK WEATHER</span>
          <strong>{selectedMood ? `Feeling ${selectedMood.label.toLowerCase()} today?` : 'How are you arriving today?'}</strong>
          <p>{selectedMood?.message || 'Your answer gently tunes the kind of plan Quiet Desk suggests.'}</p>
        </div>
        <div className="mood-options">
          {moodOptions.map((option) => (
            <button type="button" className={mood === option.key ? 'selected' : ''} key={option.key} onClick={() => chooseMood(option)} aria-pressed={mood === option.key}>
              <span>{option.emoji}</span><small>{option.label}</small>
            </button>
          ))}
        </div>
        {mood && <button type="button" className="reset-mood" onClick={() => setMood('')}>Check in again</button>}
      </section>
      {error && <p className="error-message" role="alert">{error}</p>}
      {view === 'today' && conflicts.length > 0 && (
        <div className="conflict-banner" role="status">
          <strong>Schedule conflict detected:</strong> {conflicts.map((item) => item.title).join(' and ')} overlap at the same time.
        </div>
      )}
      <section className={`planner ${chatOpen ? 'planner-open' : ''}`}>
        <button type="button" className="planner-toggle" onClick={() => setChatOpen(!chatOpen)}>
          <span><strong>Quiet Desk planner</strong><small>Ask what matters next</small></span>
          <span>{chatOpen ? 'Close' : 'Plan my day'}</span>
        </button>
        {chatOpen && (
          <form className="planner-form" onSubmit={askPlanner}>
            <label htmlFor="planner-question">Talk to Quiet Desk about your day</label>
            <div className="chat-messages">
              {chatMessages.length === 0 && <p className="chat-empty">Try “Should I attend the Halloween event?” or “Plan my day around the hackathon.”</p>}
              {chatMessages.map((message, index) => <p className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</p>)}
            </div>
            <textarea id="planner-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows="2" placeholder="Ask a personal planning question..." />
            <div className="quick-prompts">
              {['Should I attend the Halloween event?', 'What should I do first today?', 'Resolve my event conflicts'].map((prompt) => (
                <button type="button" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>
              ))}
            </div>
            <button type="submit" className="save-button" disabled={planning}>{planning ? 'Thinking…' : 'Ask Quiet Desk'}</button>
          </form>
        )}
      </section>
      <section className="command-bar" aria-label="Inbox controls">
        <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your quiet desk..." aria-label="Search items" /></label>
        <button type="button" className={`focus-button ${focusMode ? 'active' : ''}`} onClick={() => setFocusMode(!focusMode)}>{focusMode ? '✦ Focus mode on' : '✦ Focus mode'}</button>
        {(search || focusMode) && <button type="button" className="clear-button" onClick={() => { setSearch(''); setFocusMode(false) }}>Clear</button>}
        <span className="result-count">{visibleItems.length} signals</span>
      </section>

      {view === 'cv-score' ? (
        <CvScore />
      ) : view === 'ai-news' ? (
        <section className="news-page ai-news-page">
          <div className="news-page-heading"><div><p className="eyebrow">AI intelligence briefing</p><h2>Research, companies & products</h2></div><span className="source-note">Fresh headlines from Google News</span></div>
          <AiNewsBriefing news={aiNews} loading={aiNewsLoading} error={aiNewsError} onRefresh={() => setAiNewsRefresh((value) => value + 1)} refreshing={aiNewsLoading} />
        </section>
      ) : view === 'interview' ? (
        <InterviewPrep />
      ) : view === 'news' ? (
        <section className="news-page">
          <div className="news-page-heading"><div><p className="eyebrow">Live local headlines</p><h2>What’s happening in Galway</h2></div><span className="source-note">Powered by Google News</span></div>
          <NewsCards news={news} loading={newsLoading} error={newsError} />
        </section>
      ) : view === 'today' ? (
        <div className="timeline">
          <TimelineSection title="Today" note={`${energy === 'low' ? 'Gentle pace' : energy === 'high' ? 'Deep work window' : 'Present events'}`} items={todayItems} completedIds={completedIds} onToggle={toggleCompleted} emptyMessage="Nothing scheduled for today." />
          <TimelineSection title="Tomorrow" note="Next up" items={tomorrowItems} completedIds={completedIds} onToggle={toggleCompleted} emptyMessage="Nothing scheduled for tomorrow." />
          <TimelineSection title="Later" note="Coming soon" items={laterItems} completedIds={completedIds} onToggle={toggleCompleted} emptyMessage="No later items in the next week." />
          <TimelineSection title="Inbox tasks" note="No date yet" items={undatedItems} completedIds={completedIds} onToggle={toggleCompleted} emptyMessage="No undated items." />
        </div>
      ) : (
        <div className="plan-list">
          {Object.entries(groupedPlan).map(([date, dateItems]) => (
            <section className="day-group" key={date}>
              <h3>{formatDate(date)}</h3>
              <div className="item-grid">{dateItems.map((item) => <ItemCard key={item.id} item={item} completed={completedIds.has(item.id)} onToggle={toggleCompleted} />)}</div>
            </section>
          ))}
        </div>
      )}
      <GalwayNow todayItems={todayItems} />
      <GamesLauncher />
      <VoiceAssistant onAsk={askPlannerQuestion} lastAnswer={lastVoiceAnswer} planning={planning} />
      </main>
    </>
  )
}

export default App

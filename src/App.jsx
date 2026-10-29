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

function ItemCard({ item }) {
  const [decision, setDecision] = useState(item.decision)

  const choose = (value) => {
    setDecision(value)
    window.dispatchEvent(new CustomEvent('quiet-desk-decision', {
      detail: { id: item.id, decision: value },
    }))
  }

  return (
    <article className="item-card">
      <div className="item-heading">
        <span className={`tag tag-${item.type.toLowerCase()}`}>{item.type}</span>
        <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
        <span className={`cost cost-${item.cost.toLowerCase()}`}>{item.cost}</span>
      </div>
      <h3>{item.title}</h3>
      <dl>
        <div><dt>Date</dt><dd>{formatDate(item.date)}</dd></div>
        <div><dt>Time</dt><dd>{formatTime(item.time)}</dd></div>
        <div><dt>Where</dt><dd>{item.location ?? 'Location to confirm'}</dd></div>
      </dl>
      <p className="action"><strong>Next:</strong> {item.action}</p>
      <p className="reason"><strong>Why:</strong> {item.urgencyReason}</p>
      {item.image && <img className="item-image" src={item.image} alt="" loading="lazy" />}
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

function TimelineSection({ title, note, items, emptyMessage }) {
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
        <div className="item-grid">{items.map((item) => <ItemCard key={item.id} item={item} />)}</div>
      ) : (
        <p className="empty-message">{emptyMessage}</p>
      )}
    </section>
  )
}

function App() {
  const [view, setView] = useState('today')
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('quiet-desk-items')
    try {
      if (!saved) return initialItems
      const savedItems = JSON.parse(saved).map(normalizeItem)
      const savedIds = new Set(savedItems.map((item) => item.id))
      return [...savedItems, ...initialItems.filter((item) => !savedIds.has(item.id))]
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

  const todayItems = useMemo(() => items.filter((item) => item.date === getTodayKey()), [items])
  const tomorrowItems = useMemo(() => items.filter((item) => item.date === getRelativeDateKey(1)), [items])
  const pastItems = useMemo(() => items.filter((item) => item.date && item.date < getTodayKey()), [items])
  const laterItems = useMemo(() => items.filter((item) => item.date && item.date > getRelativeDateKey(1)), [items])
  const undatedItems = useMemo(() => items.filter((item) => !item.date), [items])
  const conflicts = useMemo(() => conflictsFor(todayItems), [todayItems])
  const planItems = useMemo(() => {
    const today = new Date(`${getTodayKey()}T00:00:00`)
    const end = new Date(today)
    end.setDate(end.getDate() + 7)
    return items
      .filter((item) => item.date)
      .filter((item) => {
        const date = new Date(`${item.date}T00:00:00`)
        return date >= today && date < end
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [items])
  const groupedPlan = useMemo(() => planItems.reduce((groups, item) => {
    groups[item.date] ??= []
    groups[item.date].push(item)
    return groups
  }, {}), [planItems])

  useEffect(() => {
    localStorage.setItem('quiet-desk-items', JSON.stringify(items))
  }, [items])

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

  const askPlanner = async (event) => {
    event.preventDefault()
    const userMessage = question.trim()
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
      setChatMessages((messages) => [...messages, { role: 'assistant', text: result.answer }])
    } catch (planningError) {
      setError(planningError.message)
    } finally {
      setPlanning(false)
    }
  }

  return (
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
      </nav>

      <section className="view-header">
        <div>
          <p className="eyebrow">{view === 'today' ? formatDate(getTodayKey()) : 'The week ahead'}</p>
          <h2>{view === 'today' ? 'Your day, at a glance.' : 'Seven days, gently organised.'}</h2>
        </div>
        <p className="source-note">{getInboxSourceCount()} real emails read from <code>inbox/</code></p>
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

      {view === 'today' ? (
        <div className="timeline">
          <TimelineSection title="Today" note="Present events" items={todayItems} emptyMessage="Nothing scheduled for today." />
          <TimelineSection title="Tomorrow" note="Next up" items={tomorrowItems} emptyMessage="Nothing scheduled for tomorrow." />
          <TimelineSection title="Past events" note="Done" items={pastItems} emptyMessage="No completed events yet." />
          <TimelineSection title="Later" note="Coming soon" items={laterItems} emptyMessage="No later items in the next week." />
          <TimelineSection title="Inbox tasks" note="No date yet" items={undatedItems} emptyMessage="No undated items." />
        </div>
      ) : (
        <div className="plan-list">
          {Object.entries(groupedPlan).map(([date, dateItems]) => (
            <section className="day-group" key={date}>
              <h3>{formatDate(date)}</h3>
              <div className="item-grid">{dateItems.map((item) => <ItemCard key={item.id} item={item} />)}</div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

export default App

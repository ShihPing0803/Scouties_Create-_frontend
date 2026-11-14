import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../js/db.js';
import { getStepDefs, slugOf } from './workspace-steps.js';

function StepCard({ step, number, status, story }) {
  const [expanded, setExpanded] = useState(false);
  const todoId = 'todo-' + number;

  return (
    <article className={'ws-card ' + status}>
      <div className="ws-card-header">
        <span className="ws-card-step-label">Step {number}</span>
        {status !== 'locked' && (
          <a href={step.link} className="ws-card-edit-link">
            <i className="fa-solid fa-pen" aria-hidden="true" /> Edit step
          </a>
        )}
      </div>
      <div className="ws-card-illo" aria-hidden="true">{step.illo}</div>
      <div className="ws-card-body">
        <h2 className="ws-card-title">{step.title}</h2>
        <p className="ws-card-desc">{step.desc}</p>
      </div>
      <div className="ws-todo-wrap">
        <ul id={todoId} className={'ws-todo-list' + (expanded ? ' open' : '')}>
          {(step.todos || []).map(todo => {
            const done = todo.key(story);
            return <li key={todo.text}><i className={'fa-solid ' + (done ? 'fa-circle-check done' : 'fa-circle empty')} aria-label={done ? 'Complete' : 'Incomplete'} /><span>{todo.text}</span></li>;
          })}
        </ul>
      </div>
      <div className="ws-card-footer">
        {status === 'completed' ? (
          <div className="ws-completed-footer"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Step completed</div>
        ) : (
          <>
            <button type="button" className="ws-todo-toggle" aria-controls={todoId} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              To-do list <i className="fa-solid fa-chevron-down" aria-hidden="true" style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
            </button>
            {status === 'locked' ? <span className="ws-start-btn disabled">Locked</span> : <a className="ws-start-btn" href={step.link}>Start</a>}
          </>
        )}
      </div>
    </article>
  );
}

function Workspace({ storyId, userId }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let active = true;
    window.DB.ready.then(() => {
      if (!active) return;
      const story = window.DB.getStoryById(storyId);
      setState({ story: story && String(story.userId) === userId ? story : null });
    }).catch(() => {
      if (active) setState({ error: true });
    });
    return () => { active = false; };
  }, [storyId, userId]);

  const { story, loading, error } = state;
  const steps = story ? getStepDefs(story) : [];
  const completed = steps.map(step => step.done(story));
  const query = '?id=' + encodeURIComponent(storyId);

  return (
    <>
      <header className="ws-header">
        <nav className="ws-header-left" aria-label="Workspace">
          <a href="dashboard.html" className="ws-nav-link">‹ Games</a>
          {story && <a className="ws-nav-link" href={'create/' + slugOf(story.type) + '.html?edit=' + encodeURIComponent(storyId)}>Edit game</a>}
        </nav>
        {story && <div className="ws-header-right">
          <span className="ws-lang-badge">Languages: <strong>{story.languages?.join(', ') || 'EN'}</strong></span>
          <a className="ws-preview-btn" href={'review.html' + query + '&preview=1'}>Preview game</a>
        </div>}
      </header>
      <main className="ws-page">
        <h1 className="ws-page-title">{story?.title || 'Workspace'}</h1>
        {loading && <p role="status">Loading workspace…</p>}
        {!loading && !story && <p role="alert">{error ? 'Could not load the workspace.' : 'Story not found.'}</p>}
        <div className="ws-grid" id="stepsContainer">
          {steps.map((step, index) => {
            const status = completed[index] ? 'completed' : (index === 0 || completed[index - 1]) ? 'in-progress' : 'locked';
            return <StepCard key={step.title} step={step} number={index + 1} status={status} story={story} />;
          })}
        </div>
      </main>
    </>
  );
}

const userId = sessionStorage.getItem('userId');
const storyId = new URLSearchParams(location.search).get('id');
if (!userId) location.replace('index.html');
else if (!storyId) location.replace('dashboard.html');
else createRoot(document.getElementById('workspace-root')).render(<Workspace userId={userId} storyId={storyId} />);

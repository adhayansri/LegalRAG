import React from 'react'

export default function MessageItem({ message }) {
    const isUser = message.sender === 'user'
    return (
        <div className={`d-flex mb-3 ${isUser ? 'justify-content-end' : ''}`}>
            <div className={`p-2 rounded ${isUser ? 'bg-primary text-white' : 'bg-light text-dark'}`} style={{ maxWidth: '80%' }}>
                <div>{message.text}</div>
                {!isUser && message.fallback && (
                    <div className="mt-2 small text-warning">
                        ⚠ AI model unavailable. Showing retrieved legal sections.
                    </div>
                )}
                {!isUser && message.citations && message.citations.length > 0 && (
                    <div className="mt-2 small text-muted">
                        <strong>Sources:</strong>
                        <ul>
                            {message.citations.map((c, i) => (<li key={i}>{c.act} | Section {c.section}</li>))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

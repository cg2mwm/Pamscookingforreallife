import { Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import CakesPage from './pages/CakesPage'
import CakeDetail from './pages/CakeDetail'
import BlogPage from './pages/BlogPage'
import BlogPost from './pages/BlogPost'
import BookingPage from './pages/BookingPage'

// Catches JS crashes and shows a message instead of blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong loading this page.</h2>
          <p style={{ color: '#888', marginTop: '1rem' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cakes" element={<CakesPage />} />
          <Route path="/cakes/:slug" element={<CakeDetail />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/booking" element={<BookingPage />} />
        </Routes>
      </main>
      <Footer />
    </ErrorBoundary>
  )
}

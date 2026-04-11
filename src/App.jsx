import { Routes, Route } from 'react-router-dom'
import { Component } from 'react'
import Navbar        from './components/Navbar'
import Footer        from './components/Footer'
import ApplyTheme    from './components/ApplyTheme'
import Home          from './pages/Home'
import CakesPage     from './pages/CakesPage'
import CakeDetail    from './pages/CakeDetail'
import BooksPage     from './pages/BooksPage'
import BlogPage      from './pages/BlogPage'
import BlogPost      from './pages/BlogPost'
import BookingPage   from './pages/BookingPage'
import PhotosPage    from './pages/PhotosPage'
import OrderSuccess  from './pages/OrderSuccess'
import Admin         from './pages/Admin'
import InstallPage   from './pages/InstallPage'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { err: null } }
  static getDerivedStateFromError(e) { return { err: e } }
  render() {
    if (this.state.err) return (
      <div style={{ padding:'4rem 2rem', textAlign:'center', fontFamily:'sans-serif' }}>
        <h2>Something went wrong</h2>
        <p style={{ color:'#888', marginTop:'1rem' }}>{this.state.err?.message}</p>
        <button onClick={() => this.setState({ err:null })} style={{ marginTop:'1.5rem', padding:'0.5rem 1.5rem', cursor:'pointer' }}>Try Again</button>
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/my-kitchen" element={<Admin />} />
        <Route path="*" element={
          <>
            <ApplyTheme />
            <Navbar />
            <main>
              <Routes>
                <Route path="/"              element={<Home />} />
                <Route path="/cakes"         element={<CakesPage />} />
                <Route path="/cakes/:id"     element={<CakeDetail />} />
                <Route path="/books"         element={<BooksPage />} />
                <Route path="/photos"        element={<PhotosPage />} />
                <Route path="/recipes"       element={<BlogPage />} />
                <Route path="/recipes/:id"   element={<BlogPost />} />
                <Route path="/booking"       element={<BookingPage />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/install" element={<InstallPage />} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </ErrorBoundary>
  )
}

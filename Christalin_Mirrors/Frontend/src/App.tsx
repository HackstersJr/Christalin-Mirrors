import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Testimonials from './components/Testimonials'
import About from './components/About'
import Gallery from './components/Gallery'
import Branches from './components/Branches'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
    const { theme, toggleTheme } = useTheme()

    return (
        <>
            <Navbar theme={theme} toggleTheme={toggleTheme} />
            <main>
                <Hero />
                <Services />
                <Testimonials />
                <About />
                <Gallery />
                <Branches />
                <Contact />
            </main>
            <Footer />
        </>
    )
}

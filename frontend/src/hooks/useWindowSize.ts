import { useState, useEffect } from 'react'

interface WindowSize {
    width: number
    height: number
}

export function useWindowSize(): WindowSize {
    const [size, setSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight,
    })

    useEffect(() => {
        const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    return size
}

// Breakpoints
export function useBreakpoint() {
    const { width } = useWindowSize()
    return {
        isLarge:  width >= 1200,   // full layout
        isMedium: width >= 900 && width < 1200,  // compact
        isSmall:  width < 900,     // single column
    }
}
import { useEffect } from 'react'

export function useOnMount(cb) {
    return useEffect(cb)
}
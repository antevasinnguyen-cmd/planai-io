'use client'

import { useState, useEffect } from 'react'

interface UsageData {
  chats: number
  plans: number
  words: number
}

interface LimitsData {
  chats: number
  plans: number
  words: number
}

interface UpgradePromptState {
  showQuotaWarning: boolean
  showFeatureLimit: boolean
  showGeneralUpgrade: boolean
  urgencyLevel: 'low' | 'medium' | 'high'
}

export function useUpgradePrompts(
  tier: string,
  usage?: UsageData,
  limits?: LimitsData
) {
  const [promptState, setPromptState] = useState<UpgradePromptState>({
    showQuotaWarning: false,
    showFeatureLimit: false,
    showGeneralUpgrade: false,
    urgencyLevel: 'low'
  })

  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load dismissed prompts from localStorage
    const dismissed = localStorage.getItem('dismissed_upgrade_prompts')
    if (dismissed) {
      setDismissedPrompts(new Set(JSON.parse(dismissed)))
    }
  }, [])

  useEffect(() => {
    if (tier !== 'free' || !usage || !limits) {
      setPromptState({
        showQuotaWarning: false,
        showFeatureLimit: false,
        showGeneralUpgrade: false,
        urgencyLevel: 'low'
      })
      return
    }

    const chatUsagePercent = (usage.chats / limits.chats) * 100
    const planUsagePercent = (usage.plans / limits.plans) * 100
    const maxUsagePercent = Math.max(chatUsagePercent, planUsagePercent)

    let urgencyLevel: 'low' | 'medium' | 'high' = 'low'
    let showQuotaWarning = false
    let showGeneralUpgrade = false

    // Determine urgency level and prompts
    if (maxUsagePercent >= 90) {
      urgencyLevel = 'high'
      showQuotaWarning = !dismissedPrompts.has('quota_warning_high')
    } else if (maxUsagePercent >= 70) {
      urgencyLevel = 'medium'
      showQuotaWarning = !dismissedPrompts.has('quota_warning_medium')
    } else if (maxUsagePercent >= 50) {
      urgencyLevel = 'low'
      showGeneralUpgrade = !dismissedPrompts.has('general_upgrade')
    } else {
      showGeneralUpgrade = !dismissedPrompts.has('general_upgrade_new_user')
    }

    setPromptState({
      showQuotaWarning,
      showFeatureLimit: false, // This will be triggered manually
      showGeneralUpgrade,
      urgencyLevel
    })
  }, [tier, usage, limits, dismissedPrompts])

  const dismissPrompt = (promptType: string) => {
    const newDismissed = new Set(dismissedPrompts)
    
    // Create specific key based on prompt type and urgency
    let key = promptType
    if (promptType === 'quota_warning') {
      key = `${promptType}_${promptState.urgencyLevel}`
    }
    
    newDismissed.add(key)
    setDismissedPrompts(newDismissed)
    
    // Save to localStorage
    localStorage.setItem('dismissed_upgrade_prompts', JSON.stringify(Array.from(newDismissed)))
    
    // Update state
    setPromptState(prev => ({
      ...prev,
      [promptType === 'quota_warning' ? 'showQuotaWarning' : 
       promptType === 'feature_limit' ? 'showFeatureLimit' : 
       'showGeneralUpgrade']: false
    }))
  }

  const triggerFeatureLimit = () => {
    if (!dismissedPrompts.has('feature_limit')) {
      setPromptState(prev => ({
        ...prev,
        showFeatureLimit: true
      }))
    }
  }

  const resetDismissedPrompts = () => {
    setDismissedPrompts(new Set())
    localStorage.removeItem('dismissed_upgrade_prompts')
  }

  return {
    ...promptState,
    dismissPrompt,
    triggerFeatureLimit,
    resetDismissedPrompts
  }
}

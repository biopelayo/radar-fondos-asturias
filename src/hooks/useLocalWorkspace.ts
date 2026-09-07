import { useEffect, useState } from 'react'
import type { ApplicationRecord, PrivateProfile } from '../types'

const PROFILE_KEY = 'funding-radar.profile.v1'
const APPLICATIONS_KEY = 'funding-radar.applications.v1'

export const emptyProfile: PrivateProfile = {
  displayName: '',
  residence: '',
  territories: '',
  situation: '',
  sectors: '',
  languages: '',
  investmentCeiling: '',
  incomeGoal: '',
  notes: '',
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

export function useLocalWorkspace() {
  const [profile, setProfileState] = useState<PrivateProfile>(() => readLocal(PROFILE_KEY, emptyProfile))
  const [applications, setApplications] = useState<ApplicationRecord[]>(() =>
    readLocal(APPLICATIONS_KEY, []),
  )

  useEffect(() => {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    window.localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
  }, [applications])

  const prepareApplication = (opportunityId: string) => {
    setApplications((current) => {
      const existing = current.find((item) => item.opportunityId === opportunityId)
      if (existing) {
        return current.map((item) =>
          item.opportunityId === opportunityId ? { ...item, stage: 'preparando' } : item,
        )
      }
      return [
        ...current,
        { opportunityId, stage: 'preparando', createdAt: new Date().toISOString() },
      ]
    })
  }

  const importProfile = (nextProfile: PrivateProfile) => {
    setProfileState({ ...emptyProfile, ...nextProfile })
  }

  return {
    profile,
    setProfile: setProfileState,
    importProfile,
    applications,
    prepareApplication,
  }
}

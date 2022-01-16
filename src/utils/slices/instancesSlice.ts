import analytics from '@components/analytics'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@root/store'
import { ComposeStateDraft } from '@screens/Compose/utils/types'
import { QueryKeyTimeline } from '@utils/queryHooks/timeline'
import { findIndex } from 'lodash'
import addInstance from './instances/add'
import removeInstance from './instances/remove'
import { updateAccountPreferences } from './instances/updateAccountPreferences'
import { updateConfiguration } from './instances/updateConfiguration'
import { updateFilters } from './instances/updateFilters'
import { updateInstancePush } from './instances/updatePush'
import { updateInstancePushAlert } from './instances/updatePushAlert'
import { updateInstancePushDecode } from './instances/updatePushDecode'

export type Instance = {
  active: boolean
  appData: {
    clientId: string
    clientSecret: string
  }
  url: string
  token: string
  uri: Mastodon.Instance['uri']
  urls: Mastodon.Instance['urls']
  account: {
    id: Mastodon.Account['id']
    acct: Mastodon.Account['acct']
    avatarStatic: Mastodon.Account['avatar_static']
    preferences: Mastodon.Preferences
  }
  max_toot_chars?: number // To be deprecated in v4
  configuration?: Mastodon.Instance['configuration']
  filters: Mastodon.Filter[]
  notifications_filter: {
    follow: boolean
    favourite: boolean
    reblog: boolean
    mention: boolean
    poll: boolean
    follow_request: boolean
  }
  push: {
    global: { loading: boolean; value: boolean }
    decode: { loading: boolean; value: boolean }
    alerts: {
      follow: {
        loading: boolean
        value: Mastodon.PushSubscription['alerts']['follow']
      }
      favourite: {
        loading: boolean
        value: Mastodon.PushSubscription['alerts']['favourite']
      }
      reblog: {
        loading: boolean
        value: Mastodon.PushSubscription['alerts']['reblog']
      }
      mention: {
        loading: boolean
        value: Mastodon.PushSubscription['alerts']['mention']
      }
      poll: {
        loading: boolean
        value: Mastodon.PushSubscription['alerts']['poll']
      }
    }
    keys: {
      auth?: string
      public?: string // legacy
      private?: string // legacy
    }
  }
  timelinesLookback?: {
    [key: string]: {
      queryKey: QueryKeyTimeline
      ids: Mastodon.Status['id'][]
    }
  }
  mePage: {
    lists: { shown: boolean }
    announcements: { shown: boolean; unread: number }
  }
  drafts: ComposeStateDraft[]
}

export type InstancesState = {
  instances: Instance[]
}

export const instancesInitialState: InstancesState = {
  instances: []
}

const findInstanceActive = (instances: Instance[]) =>
  instances.findIndex(instance => instance.active)

const instancesSlice = createSlice({
  name: 'instances',
  initialState: instancesInitialState,
  reducers: {
    updateInstanceActive: ({ instances }, action: PayloadAction<Instance>) => {
      instances = instances.map(instance => {
        instance.active =
          instance.url === action.payload.url &&
          instance.token === action.payload.token &&
          instance.account.id === action.payload.account.id
        return instance
      })
    },
    updateInstanceAccount: (
      { instances },
      action: PayloadAction<Pick<Instance['account'], 'acct' & 'avatarStatic'>>
    ) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].account = {
        ...instances[activeIndex].account,
        ...action.payload
      }
    },
    updateInstanceNotificationsFilter: (
      { instances },
      action: PayloadAction<Instance['notifications_filter']>
    ) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].notifications_filter = action.payload
    },
    updateInstanceDraft: (
      { instances },
      action: PayloadAction<ComposeStateDraft>
    ) => {
      const activeIndex = findInstanceActive(instances)
      const draftIndex = findIndex(instances[activeIndex].drafts, [
        'timestamp',
        action.payload.timestamp
      ])
      if (draftIndex === -1) {
        instances[activeIndex].drafts.unshift(action.payload)
      } else {
        instances[activeIndex].drafts[draftIndex] = action.payload
      }
    },
    removeInstanceDraft: (
      { instances },
      action: PayloadAction<ComposeStateDraft['timestamp']>
    ) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].drafts = instances[activeIndex].drafts?.filter(
        draft => draft.timestamp !== action.payload
      )
    },
    clearPushLoading: ({ instances }) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].push.global.loading = false
      instances[activeIndex].push.decode.loading = false
      instances[activeIndex].push.alerts.favourite.loading = false
      instances[activeIndex].push.alerts.follow.loading = false
      instances[activeIndex].push.alerts.mention.loading = false
      instances[activeIndex].push.alerts.poll.loading = false
      instances[activeIndex].push.alerts.reblog.loading = false
    },
    disableAllPushes: ({ instances }) => {
      instances = instances.map(instance => {
        let newInstance = instance
        newInstance.push.global.value = false
        return newInstance
      })
    },
    updateInstanceTimelineLookback: (
      { instances },
      action: PayloadAction<Instance['timelinesLookback']>
    ) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].timelinesLookback = {
        ...instances[activeIndex].timelinesLookback,
        ...action.payload
      }
    },
    updateInstanceMePage: (
      { instances },
      action: PayloadAction<Partial<Instance['mePage']>>
    ) => {
      const activeIndex = findInstanceActive(instances)
      instances[activeIndex].mePage = {
        ...instances[activeIndex].mePage,
        ...action.payload
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(addInstance.fulfilled, (state, action) => {
        switch (action.payload.type) {
          case 'add':
            state.instances.length &&
              (state.instances = state.instances.map(instance => {
                instance.active = false
                return instance
              }))
            state.instances.push(action.payload.data)
            break
          case 'overwrite':
            state.instances = state.instances.map(instance => {
              if (
                instance.url === action.payload.data.url &&
                instance.account.id === action.payload.data.account.id
              ) {
                return action.payload.data
              } else {
                instance.active = false
                return instance
              }
            })
        }

        analytics('login')
      })
      .addCase(addInstance.rejected, (state, action) => {
        console.error(state.instances)
        console.error(action.error)
      })

      .addCase(removeInstance.fulfilled, (state, action) => {
        state.instances = state.instances.filter(instance => {
          if (
            instance.url === action.payload.url &&
            instance.account.id === action.payload.account.id
          ) {
            return false
          } else {
            return true
          }
        })
        state.instances.length &&
          (state.instances[state.instances.length - 1].active = true)

        analytics('logout')
      })
      .addCase(removeInstance.rejected, (state, action) => {
        console.error(state)
        console.error(action.error)
      })

      // Update Instance Account Filters
      .addCase(updateFilters.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].filters = action.payload
      })
      .addCase(updateFilters.rejected, (_, action) => {
        console.error(action.error)
      })

      // Update Instance Account Preferences
      .addCase(updateAccountPreferences.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].account.preferences = action.payload
      })
      .addCase(updateAccountPreferences.rejected, (_, action) => {
        console.error(action.error)
      })

      // Update Instance Configuration
      .addCase(updateConfiguration.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].max_toot_chars =
          action.payload.max_toot_chars
        state.instances[activeIndex].configuration =
          action.payload.configuration
      })
      .addCase(updateConfiguration.rejected, (_, action) => {
        console.error(action.error)
      })

      // Update Instance Push Global
      .addCase(updateInstancePush.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.global.loading = false
        state.instances[activeIndex].push.global.value = action.meta.arg
        state.instances[activeIndex].push.keys = { auth: action.payload }
      })
      .addCase(updateInstancePush.rejected, state => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.global.loading = false
      })
      .addCase(updateInstancePush.pending, state => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.global.loading = true
      })

      // Update Instance Push Decode
      .addCase(updateInstancePushDecode.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.decode.loading = false
        state.instances[activeIndex].push.decode.value = action.payload.disable
      })
      .addCase(updateInstancePushDecode.rejected, state => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.decode.loading = false
      })
      .addCase(updateInstancePushDecode.pending, state => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.decode.loading = true
      })

      // Update Instance Push Individual Alert
      .addCase(updateInstancePushAlert.fulfilled, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.alerts[
          action.meta.arg.changed
        ].loading = false
        state.instances[activeIndex].push.alerts = action.payload
      })
      .addCase(updateInstancePushAlert.rejected, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.alerts[
          action.meta.arg.changed
        ].loading = false
      })
      .addCase(updateInstancePushAlert.pending, (state, action) => {
        const activeIndex = findInstanceActive(state.instances)
        state.instances[activeIndex].push.alerts[
          action.meta.arg.changed
        ].loading = true
      })
  }
})

export const getInstanceActive = ({ instances: { instances } }: RootState) =>
  findInstanceActive(instances)

export const getInstances = ({ instances: { instances } }: RootState) =>
  instances

export const getInstance = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]

export const getInstanceUrl = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.url

export const getInstanceUri = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.uri

export const getInstanceUrls = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.urls

/* Get Instance Configuration */
export const getInstanceConfigurationStatusMaxChars = ({
  instances: { instances }
}: RootState) =>
  instances[findInstanceActive(instances)]?.configuration?.statuses
    .max_characters ||
  instances[findInstanceActive(instances)]?.max_toot_chars ||
  500

export const getInstanceConfigurationStatusMaxAttachments = ({
  instances: { instances }
}: RootState) =>
  instances[findInstanceActive(instances)]?.configuration?.statuses
    .max_media_attachments || 4

export const getInstanceConfigurationStatusCharsURL = ({
  instances: { instances }
}: RootState) =>
  instances[findInstanceActive(instances)]?.configuration?.statuses
    .characters_reserved_per_url || 23

export const getInstanceConfigurationPoll = ({
  instances: { instances }
}: RootState) =>
  instances[findInstanceActive(instances)]?.configuration?.polls || {
    max_options: 4,
    max_characters_per_option: 50,
    min_expiration: 300,
    max_expiration: 2629746
  }
/* END */

export const getInstanceAccount = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.account

export const getInstanceNotificationsFilter = ({
  instances: { instances }
}: RootState) => instances[findInstanceActive(instances)].notifications_filter

export const getInstancePush = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.push

export const getInstanceTimelinesLookback = ({
  instances: { instances }
}: RootState) => instances[findInstanceActive(instances)]?.timelinesLookback

export const getInstanceMePage = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.mePage

export const getInstanceDrafts = ({ instances: { instances } }: RootState) =>
  instances[findInstanceActive(instances)]?.drafts

export const {
  updateInstanceActive,
  updateInstanceAccount,
  updateInstanceNotificationsFilter,
  updateInstanceDraft,
  removeInstanceDraft,
  clearPushLoading,
  disableAllPushes,
  updateInstanceTimelineLookback,
  updateInstanceMePage
} = instancesSlice.actions

export default instancesSlice.reducer

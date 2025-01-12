import analytics from '@components/analytics'
import { HeaderLeft } from '@components/Header'
import { displayMessage, Message } from '@components/Message'
import navigationRef from '@helpers/navigationRef'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ScreenActions from '@screens/Actions'
import ScreenAnnouncements from '@screens/Announcements'
import ScreenCompose from '@screens/Compose'
import ScreenImagesViewer from '@screens/ImagesViewer'
import ScreenTabs from '@screens/Tabs'
import initQuery from '@utils/initQuery'
import { RootStackParamList } from '@utils/navigation/navigators'
import pushUseConnect from '@utils/push/useConnect'
import pushUseReceive from '@utils/push/useReceive'
import pushUseRespond from '@utils/push/useRespond'
import { updatePreviousTab } from '@utils/slices/contextsSlice'
import { checkEmojis } from '@utils/slices/instances/checkEmojis'
import { updateAccountPreferences } from '@utils/slices/instances/updateAccountPreferences'
import { updateConfiguration } from '@utils/slices/instances/updateConfiguration'
import { updateFilters } from '@utils/slices/instances/updateFilters'
import { getInstanceActive, getInstances } from '@utils/slices/instancesSlice'
import { useTheme } from '@utils/styles/ThemeManager'
import { themes } from '@utils/styles/themes'
import * as Linking from 'expo-linking'
import { addScreenshotListener } from 'expo-screen-capture'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Platform, StatusBar } from 'react-native'
import ShareMenu from 'react-native-share-menu'
import { useSelector } from 'react-redux'
import * as Sentry from 'sentry-expo'
import { useAppDispatch } from './store'

const Stack = createNativeStackNavigator<RootStackParamList>()

export interface Props {
  localCorrupt?: string
}

const Screens: React.FC<Props> = ({ localCorrupt }) => {
  const { t } = useTranslation('screens')
  const dispatch = useAppDispatch()
  const instanceActive = useSelector(getInstanceActive)
  const { colors, theme } = useTheme()

  const routeRef = useRef<{ name?: string; params?: {} }>()

  // Push hooks
  const instances = useSelector(
    getInstances,
    (prev, next) => prev.length === next.length
  )
  pushUseConnect({ t, instances })
  pushUseReceive({ instances })
  pushUseRespond({ instances })

  // Prevent screenshot alert
  useEffect(() => {
    const screenshotListener = addScreenshotListener(() =>
      Alert.alert(t('screenshot.title'), t('screenshot.message'), [
        { text: t('screenshot.button'), style: 'destructive' }
      ])
    )
    Platform.select({ ios: screenshotListener })
    return () => screenshotListener.remove()
  }, [])

  // On launch display login credentials corrupt information
  useEffect(() => {
    const showLocalCorrect = () => {
      if (localCorrupt) {
        displayMessage({
          message: t('localCorrupt.message'),
          description: localCorrupt.length ? localCorrupt : undefined,
          type: 'error',
          theme
        })
        // @ts-ignore
        navigationRef.navigate('Screen-Tabs', {
          screen: 'Tab-Me'
        })
      }
    }
    return showLocalCorrect()
  }, [localCorrupt])

  // Lazily update users's preferences, for e.g. composing default visibility
  useEffect(() => {
    if (instanceActive !== -1) {
      dispatch(updateConfiguration())
      dispatch(updateFilters())
      dispatch(updateAccountPreferences())
      dispatch(checkEmojis())
    }
  }, [instanceActive])

  // Callbacks
  const navigationContainerOnReady = useCallback(() => {
    const currentRoute = navigationRef.getCurrentRoute()
    routeRef.current = {
      name: currentRoute?.name,
      params: currentRoute?.params
        ? JSON.stringify(currentRoute.params)
        : undefined
    }
  }, [])
  const navigationContainerOnStateChange = useCallback(() => {
    const previousRoute = routeRef.current
    const currentRoute = navigationRef.getCurrentRoute()

    const matchTabName = currentRoute?.name?.match(/(Tab-.*)-Root/)
    if (matchTabName) {
      //@ts-ignore
      dispatch(updatePreviousTab(matchTabName[1]))
    }

    if (previousRoute?.name !== currentRoute?.name) {
      analytics('screen_view', { screen_name: currentRoute?.name })
      Sentry.Native.setContext('page', {
        previous: previousRoute,
        current: currentRoute
      })
    }

    routeRef.current = currentRoute
  }, [])

  // Deep linking for compose
  const [deeplinked, setDeeplinked] = useState(false)
  useEffect(() => {
    const getUrlAsync = async () => {
      setDeeplinked(true)

      const initialUrl = await Linking.parseInitialURLAsync()

      if (initialUrl.path) {
        const paths = initialUrl.path.split('/')

        if (paths && paths.length) {
          const instanceIndex = instances.findIndex(
            instance => paths[0] === `@${instance.account.acct}@${instance.uri}`
          )
          if (instanceIndex !== -1 && instanceActive !== instanceIndex) {
            initQuery({
              instance: instances[instanceIndex],
              prefetch: { enabled: true }
            })
          }
        }
      }

      if (initialUrl.hostname === 'compose') {
        navigationRef.navigate('Screen-Compose')
      }
    }
    if (!deeplinked) {
      getUrlAsync()
    }
  }, [instanceActive, instances, deeplinked])

  // Share Extension
  const handleShare = useCallback(
    (
      item?:
        | {
            data: { mimeType: string; data: string }[]
            mimeType: undefined
          }
        | { data: string | string[]; mimeType: string }
    ) => {
      if (instanceActive < 0) {
        return
      }
      if (!item || !item.data) {
        return
      }

      let text: string | undefined = undefined
      let images: { type: string; uri: string }[] = []
      let video: { type: string; uri: string } | undefined = undefined

      switch (Platform.OS) {
        case 'ios':
          if (!Array.isArray(item.data) || !item.data) {
            return
          }

          item.data.forEach(d => {
            if (typeof d === 'string') return
            const typesImage = ['png', 'jpg', 'jpeg', 'gif']
            const typesVideo = ['mp4', 'm4v', 'mov', 'webm']
            const { mimeType, data } = d
            if (mimeType.startsWith('image/')) {
              if (!typesImage.includes(mimeType.split('/')[1])) {
                console.warn(
                  'Image type not supported:',
                  mimeType.split('/')[1]
                )
                displayMessage({
                  message: t('shareError.imageNotSupported', {
                    type: mimeType.split('/')[1]
                  }),
                  type: 'error',
                  theme
                })
                return
              }
              images.push({ type: mimeType.split('/')[1], uri: data })
            } else if (mimeType.startsWith('video/')) {
              if (!typesVideo.includes(mimeType.split('/')[1])) {
                console.warn(
                  'Video type not supported:',
                  mimeType.split('/')[1]
                )
                displayMessage({
                  message: t('shareError.videoNotSupported', {
                    type: mimeType.split('/')[1]
                  }),
                  type: 'error',
                  theme
                })
                return
              }
              video = { type: mimeType.split('/')[1], uri: data }
            } else {
              if (typesImage.includes(data.split('.').pop() || '')) {
                images.push({ type: data.split('.').pop()!, uri: data })
                return
              }
              if (typesVideo.includes(data.split('.').pop() || '')) {
                video = { type: data.split('.').pop()!, uri: data }
                return
              }
              text = !text ? data : text.concat(text, `\n${data}`)
            }
          })
          break
        case 'android':
          if (!item.mimeType) {
            return
          }
          let tempData: string[]
          if (!Array.isArray(item.data)) {
            tempData = [item.data]
          } else {
            tempData = item.data
          }
          tempData.forEach(d => {
            const typesImage = ['png', 'jpg', 'jpeg', 'gif']
            const typesVideo = ['mp4', 'm4v', 'mov', 'webm', 'mpeg']
            if (item.mimeType!.startsWith('image/')) {
              if (!typesImage.includes(item.mimeType.split('/')[1])) {
                console.warn(
                  'Image type not supported:',
                  item.mimeType.split('/')[1]
                )
                displayMessage({
                  message: t('shareError.imageNotSupported', {
                    type: item.mimeType.split('/')[1]
                  }),
                  type: 'error',
                  theme
                })
                return
              }
              images.push({ type: item.mimeType.split('/')[1], uri: d })
            } else if (item.mimeType.startsWith('video/')) {
              if (!typesVideo.includes(item.mimeType.split('/')[1])) {
                console.warn(
                  'Video type not supported:',
                  item.mimeType.split('/')[1]
                )
                displayMessage({
                  message: t('shareError.videoNotSupported', {
                    type: item.mimeType.split('/')[1]
                  }),
                  type: 'error',
                  theme
                })
                return
              }
              video = { type: item.mimeType.split('/')[1], uri: d }
            } else {
              if (typesImage.includes(d.split('.').pop() || '')) {
                images.push({ type: d.split('.').pop()!, uri: d })
                return
              }
              if (typesVideo.includes(d.split('.').pop() || '')) {
                video = { type: d.split('.').pop()!, uri: d }
                return
              }
              text = !text ? d : text.concat(text, `\n${d}`)
            }
          })
          break
      }

      if (!text && (!images || !images.length) && !video) {
        return
      } else {
        navigationRef.navigate('Screen-Compose', {
          type: 'share',
          text,
          images,
          video
        })
      }
    },
    [instanceActive]
  )
  useEffect(() => {
    ShareMenu.getInitialShare(handleShare)
  }, [])
  useEffect(() => {
    const listener = ShareMenu.addNewShareListener(handleShare)
    return () => {
      listener.remove()
    }
  }, [])

  return (
    <>
      <StatusBar backgroundColor={colors.backgroundDefault} />
      <NavigationContainer
        ref={navigationRef}
        theme={themes[theme]}
        onReady={navigationContainerOnReady}
        onStateChange={navigationContainerOnStateChange}
      >
        <Stack.Navigator initialRouteName='Screen-Tabs'>
          <Stack.Screen
            name='Screen-Tabs'
            component={ScreenTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name='Screen-Actions'
            component={ScreenActions}
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false
            }}
          />
          <Stack.Screen
            name='Screen-Announcements'
            component={ScreenAnnouncements}
            options={({ navigation }) => ({
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: true,
              headerShadowVisible: false,
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
              headerLeft: () => (
                <HeaderLeft content='X' onPress={() => navigation.goBack()} />
              ),
              title: t('screenAnnouncements:heading')
            })}
          />
          <Stack.Screen
            name='Screen-Compose'
            component={ScreenCompose}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal'
            }}
          />
          <Stack.Screen
            name='Screen-ImagesViewer'
            component={ScreenImagesViewer}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade'
            }}
          />
        </Stack.Navigator>

        <Message />
      </NavigationContainer>
    </>
  )
}

export default React.memo(Screens, () => true)

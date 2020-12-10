import React from 'react'

import ScreenSharedAccount from 'src/screens/Shared/Account'
import ScreenSharedHashtag from 'src/screens/Shared/Hashtag'
import ScreenSharedToot from 'src/screens/Shared/Toot'
import ScreenSharedWebview from 'src/screens/Shared/Webview'
import Compose from 'src/screens/Shared/Compose'
import ComposeEditAttachment from './Compose/EditAttachment'
import ScreenSharedSearch from './Search'
import { useTranslation } from 'react-i18next'

const sharedScreens = (Stack: any) => {
  const { t } = useTranslation()

  return [
    <Stack.Screen
      key='Screen-Shared-Account'
      name='Screen-Shared-Account'
      component={ScreenSharedAccount}
      options={{
        headerTranslucent: true,
        headerStyle: { backgroundColor: 'rgba(255, 255, 255, 0)' },
        headerCenter: () => <></>
      }}
    />,
    <Stack.Screen
      key='Screen-Shared-Hashtag'
      name='Screen-Shared-Hashtag'
      component={ScreenSharedHashtag}
      options={({ route }: any) => ({
        title: `#${decodeURIComponent(route.params.hashtag)}`
      })}
    />,
    <Stack.Screen
      key='Screen-Shared-Toot'
      name='Screen-Shared-Toot'
      component={ScreenSharedToot}
      options={() => ({
        title: t('sharedToot:heading')
      })}
    />,
    <Stack.Screen
      key='Screen-Shared-Webview'
      name='Screen-Shared-Webview'
      component={ScreenSharedWebview}
      options={() => ({
        stackPresentation: 'modal'
      })}
    />,
    <Stack.Screen
      key='Screen-Shared-Compose'
      name='Screen-Shared-Compose'
      component={Compose}
      options={{
        stackPresentation: 'fullScreenModal'
      }}
    />,
    <Stack.Screen
      key='Screen-Shared-Compose-EditAttachment'
      name='Screen-Shared-Compose-EditAttachment'
      component={ComposeEditAttachment}
      options={{
        stackPresentation: 'modal',
      }}
    />,
    <Stack.Screen
      key='Screen-Shared-Search'
      name='Screen-Shared-Search'
      component={ScreenSharedSearch}
      options={{
        stackPresentation: 'modal'
      }}
    />
  ]
}

export default sharedScreens
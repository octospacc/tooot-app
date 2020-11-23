import React from 'react'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'

import ScreenMeRoot from 'src/screens/Me/Root'
import ScreenMeConversations from './Me/Cconversations'
import ScreenMeBookmarks from './Me/Bookmarks'
import ScreenMeFavourites from './Me/Favourites'
import ScreenMeLists from './Me/Lists'
import sharedScreens from 'src/screens/Shared/sharedScreens'
import ScreenMeListsList from './Me/Root/Lists/List'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

const Stack = createNativeStackNavigator()

const ScreenMe: React.FC = () => {
  const localRegistered = useSelector(
    (state: RootState) => state.instances.local.url
  )

  return (
    <Stack.Navigator>
      <Stack.Screen
        name='Screen-Me-Root'
        component={ScreenMeRoot}
        options={
          localRegistered
            ? {
                headerTranslucent: true,
                headerStyle: { backgroundColor: 'rgba(255, 255, 255, 0)' },
                headerCenter: () => <></>
              }
            : { headerTitle: '我的长毛象' }
        }
      />
      <Stack.Screen
        name='Screen-Me-Conversations'
        component={ScreenMeConversations}
        options={{
          headerTitle: '对话'
        }}
      />
      <Stack.Screen
        name='Screen-Me-Bookmarks'
        component={ScreenMeBookmarks}
        options={{
          headerTitle: '书签'
        }}
      />
      <Stack.Screen
        name='Screen-Me-Favourites'
        component={ScreenMeFavourites}
        options={{
          headerTitle: '书签'
        }}
      />
      <Stack.Screen
        name='Screen-Me-Lists'
        component={ScreenMeLists}
        options={{
          headerTitle: '书签'
        }}
      />
      <Stack.Screen
        name='Screen-Me-Lists-List'
        component={ScreenMeListsList}
        options={{
          headerTitle: '书签'
        }}
      />

      {sharedScreens(Stack)}
    </Stack.Navigator>
  )
}

export default ScreenMe

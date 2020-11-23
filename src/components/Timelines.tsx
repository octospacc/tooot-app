import React, { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Text, View } from 'react-native'
import SegmentedControl from '@react-native-community/segmented-control'
import { createNativeStackNavigator } from 'react-native-screens/native-stack'
import { useSelector } from 'react-redux'
import { Feather } from '@expo/vector-icons'

import Timeline from './Timelines/Timeline'
import sharedScreens from 'src/screens/Shared/sharedScreens'
import { getRemoteUrl, InstancesState } from 'src/utils/slices/instancesSlice'
import { RootState, store } from 'src/store'
import { useTheme } from 'src/utils/styles/ThemeManager'
import { useNavigation } from '@react-navigation/native'
import getCurrentTab from 'src/utils/getCurrentTab'
import PleaseLogin from './PleaseLogin'

const Stack = createNativeStackNavigator()

const Page = ({
  item: { page },
  localRegistered
}: {
  item: { page: App.Pages }
  localRegistered: InstancesState['local']['url'] | undefined
}) => {
  return (
    <View style={{ width: Dimensions.get('window').width }}>
      {localRegistered || page === 'RemotePublic' ? (
        <Timeline page={page} />
      ) : (
        <PleaseLogin />
      )}
    </View>
  )
}

export interface Props {
  name: 'Screen-Local-Root' | 'Screen-Public-Root'
  content: { title: string; page: App.Pages }[]
}

const Timelines: React.FC<Props> = ({ name, content }) => {
  const navigation = useNavigation()
  const { theme } = useTheme()
  const localRegistered = useSelector(
    (state: RootState) => state.instances.local.url
  )
  const publicDomain = getRemoteUrl(store.getState())
  const [segment, setSegment] = useState(0)
  const [renderHeader, setRenderHeader] = useState(false)
  const [segmentManuallyTriggered, setSegmentManuallyTriggered] = useState(
    false
  )

  useEffect(() => {
    const nbr = setTimeout(() => setRenderHeader(true), 50)
    return
  }, [])

  const horizontalPaging = useRef<FlatList>(null!)

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={name}
        options={{
          headerTitle: name === 'Screen-Public-Root' ? publicDomain : '',
          ...(renderHeader &&
            localRegistered && {
              headerCenter: () => (
                <SegmentedControl
                  values={[content[0].title, content[1].title]}
                  selectedIndex={segment}
                  onChange={({ nativeEvent }) => {
                    setSegmentManuallyTriggered(true)
                    setSegment(nativeEvent.selectedSegmentIndex)
                    horizontalPaging.current.scrollToIndex({
                      index: nativeEvent.selectedSegmentIndex
                    })
                  }}
                  style={{ width: 150, height: 30 }}
                />
              ),
              headerRight: () => (
                <Feather
                  name='search'
                  size={24}
                  color={theme.secondary}
                  onPress={() => {
                    navigation.navigate(getCurrentTab(navigation), {
                      screen: 'Screen-Shared-Search'
                    })
                  }}
                />
              )
            })
        }}
      >
        {() => {
          return (
            <FlatList
              style={{ width: Dimensions.get('window').width, height: '100%' }}
              data={content}
              extraData={localRegistered}
              keyExtractor={({ page }) => page}
              renderItem={({ item, index }) => {
                if (!localRegistered && index === 0) {
                  return null
                }
                return (
                  <Page
                    key={index}
                    item={item}
                    localRegistered={localRegistered}
                  />
                )
              }}
              ref={horizontalPaging}
              bounces={false}
              getItemLayout={(data, index) => ({
                length: Dimensions.get('window').width,
                offset: Dimensions.get('window').width * index,
                index
              })}
              horizontal
              onMomentumScrollEnd={() => setSegmentManuallyTriggered(false)}
              onScroll={({ nativeEvent }) =>
                !segmentManuallyTriggered &&
                setSegment(
                  nativeEvent.contentOffset.x <=
                    Dimensions.get('window').width / 2
                    ? 0
                    : 1
                )
              }
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            />
          )
        }}
      </Stack.Screen>

      {sharedScreens(Stack)}
    </Stack.Navigator>
  )
}

export default Timelines

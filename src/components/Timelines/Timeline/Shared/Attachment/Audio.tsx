import Button from '@components/Button'
import { Slider } from '@sharcoux/slider'
import { StyleConstants } from '@utils/styles/constants'
import { useTheme } from '@utils/styles/ThemeManager'
import { Audio } from 'expo-av'
import { Surface } from 'gl-react-expo'
import { Blurhash } from 'gl-react-blurhash'
import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import GracefullyImage from '@components/GracefullyImage'

export interface Props {
  sensitiveShown: boolean
  audio: Mastodon.AttachmentAudio
}

const AttachmentAudio: React.FC<Props> = ({ sensitiveShown, audio }) => {
  const { theme } = useTheme()

  const [audioPlayer, setAudioPlayer] = useState<Audio.Sound>()
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioPosition, setAudioPosition] = useState(0)
  const playAudio = useCallback(async () => {
    if (!audioPlayer) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audio.url },
        {},
        // @ts-ignore
        props => setAudioPosition(props.positionMillis)
      )
      setAudioPlayer(sound)
    } else {
      await audioPlayer.setPositionAsync(audioPosition)
      audioPlayer.playAsync()
      setAudioPlaying(true)
    }
  }, [audioPlayer, audioPosition])
  const pauseAudio = useCallback(async () => {
    audioPlayer!.pauseAsync()
    setAudioPlaying(false)
  }, [audioPlayer])
  console.log(audio)
  return (
    <View style={[styles.base, { backgroundColor: theme.disabled }]}>
      <View style={styles.overlay}>
        {sensitiveShown ? (
          audio.blurhash && (
            <Surface
              style={{
                width: '100%',
                height: '100%'
              }}
            >
              <Blurhash hash={audio.blurhash} />
            </Surface>
          )
        ) : (
          <>
            {(audio.preview_url || audio.preview_remote_url) && (
              <GracefullyImage
                uri={{
                  original: audio.preview_url || audio.preview_remote_url
                }}
                style={styles.background}
              />
            )}
            <Button
              type='icon'
              content={audioPlaying ? 'PauseCircle' : 'PlayCircle'}
              size='L'
              round
              overlay
              {...(audioPlaying
                ? { onPress: pauseAudio }
                : { onPress: playAudio })}
            />
          </>
        )}
      </View>
      <View
        style={{
          alignSelf: 'flex-end',
          width: '100%',
          height: StyleConstants.Spacing.M + StyleConstants.Spacing.S * 2,
          backgroundColor: theme.backgroundOverlay,
          paddingHorizontal: StyleConstants.Spacing.Global.PagePadding,
          borderRadius: 100,
          opacity: sensitiveShown ? 0.35 : undefined
        }}
      >
        <Slider
          minimumValue={0}
          maximumValue={audio.meta.original.duration * 1000}
          value={audioPosition}
          minimumTrackTintColor={theme.secondary}
          maximumTrackTintColor={theme.disabled}
          // onSlidingStart={() => {
          //   console.log('yes!!!')
          //   audioPlayer?.pauseAsync()
          //   setAudioPlaying(false)
          // }}
          // onSlidingComplete={value => {
          //   console.log('no!!!')
          //   setAudioPosition(value)
          // }}
          enabled={false} // Bug in above sliding actions
          thumbSize={StyleConstants.Spacing.M}
          thumbTintColor={theme.primaryOverlay}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    flexBasis: '50%',
    aspectRatio: 16 / 9,
    padding: StyleConstants.Spacing.XS / 2,
    flexDirection: 'row'
  },
  background: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default AttachmentAudio

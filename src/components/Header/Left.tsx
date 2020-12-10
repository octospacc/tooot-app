import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from 'src/utils/styles/ThemeManager'
import { StyleConstants } from 'src/utils/styles/constants'

export interface Props {
  onPress: () => void
  text?: string
  icon?: string
}

const HeaderLeft: React.FC<Props> = ({ onPress, text, icon }) => {
  const { theme } = useTheme()

  return (
    <Pressable onPress={onPress} style={styles.base}>
      {text ? (
        <Text style={[styles.text, { color: theme.primary }]}>{text}</Text>
      ) : (
        <Feather
          name={icon || 'chevron-left'}
          color={theme.primary}
          size={StyleConstants.Font.Size.L}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingRight: StyleConstants.Spacing.S
  },
  text: {
    fontSize: StyleConstants.Font.Size.M
  }
})

export default React.memo(HeaderLeft, (prev, next) => {
  let skipUpdate = true
  skipUpdate = prev.text === next.text
  skipUpdate = prev.icon === next.icon
  return skipUpdate
})

import { ParseHTML } from '@components/Parse'
import { StyleConstants } from '@utils/styles/constants'
import { useTheme } from '@utils/styles/ThemeManager'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { PlaceholderLine } from 'rn-placeholder'

export interface Props {
  style?: ViewStyle
  header: string
  content?: string
  potentialWidth?: number
}

const InstanceInfo = React.memo(
  ({ style, header, content, potentialWidth }: Props) => {
    const { t } = useTranslation('componentInstance')
    const { theme } = useTheme()

    return (
      <View style={[styles.base, style]}>
        <Text style={[styles.header, { color: theme.primary }]}>{header}</Text>
        {content ? (
          <ParseHTML
            content={content}
            size={'M'}
            numberOfLines={5}
            expandHint={t('server.information.description.expandHint')}
          />
        ) : (
          <PlaceholderLine
            width={
              potentialWidth
                ? potentialWidth * StyleConstants.Font.Size.M
                : undefined
            }
            height={StyleConstants.Font.LineHeight.M}
            color={theme.shimmerDefault}
            noMargin
            style={{ borderRadius: 0 }}
          />
        )}
      </View>
    )
  },
  (prev, next) => prev.content === next.content
)

const styles = StyleSheet.create({
  base: {
    flex: 1,
    marginTop: StyleConstants.Spacing.M,
    paddingLeft: StyleConstants.Spacing.Global.PagePadding,
    paddingRight: StyleConstants.Spacing.Global.PagePadding
  },
  header: {
    ...StyleConstants.FontStyle.S,
    fontWeight: StyleConstants.Font.Weight.Bold,
    marginBottom: StyleConstants.Spacing.XS
  }
})

export default InstanceInfo

export default {
  content: {
    header: {
      prefix: 'Search',
      placeholder: 'for...'
    },
    empty: {
      general:
        'Enter keyword to search for <bold>$t(sharedSearch:content.sections.accounts)</bold>、<bold>$t(sharedSearch:content.sections.hashtags)</bold> or <bold>$t(sharedSearch:content.sections.statuses)</bold>',
      advanced: {
        header: 'Advanced search',
        example: {
          account:
            '$t(sharedSearch:content.header.prefix)$t(sharedSearch:content.sections.accounts)',
          hashtag:
            '$t(sharedSearch:content.header.prefix)$t(sharedSearch:content.sections.hashtags)',
          statusLink:
            '$t(sharedSearch:content.header.prefix)$t(sharedSearch:content.sections.statuses)',
          accountLink:
            '$t(sharedSearch:content.header.prefix)$t(sharedSearch:content.sections.accounts)'
        }
      }
    },
    sections: {
      accounts: 'User',
      hashtags: 'Hashtag',
      statuses: 'Toot'
    },
    notFound: 'Cannot find <bold>{{searchTerm}}</bold> related {{type}}'
  }
}
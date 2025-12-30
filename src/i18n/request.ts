import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import merge from 'lodash/merge';

export default getRequestConfig(async () => {
  // We can determine the locale from cookies or a header
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  const userMessages = (await import(`../messages/${locale}.json`)).default;
  const defaultMessages = (await import(`../messages/en.json`)).default;

  return {
    locale,
    messages: merge({}, defaultMessages, userMessages)
  };
});

import { useState } from 'react'
import { injectScript } from '@module-federation/utilities'
import dynamic from 'next/dynamic'

const pageMap = new Map();

function DynamicComponent({ remote, path, props }) {
  const [Component] = useState(() => {
    if (typeof window === 'undefined') {
      return pageMap.get(path);
    }
    return dynamic(() => {
      return injectScript(remote)
        .then(container => container.get(`.${path}`))
        .then(factory => factory())
    }, {
      ssr: true,
      // how to prevent hydration before Component is loaded?
      loading: () => null,
    })
  });

  return <Component {...props} />;
}

export function Page({ path, props }) {
  return <DynamicComponent remote="shop" path={path} props={props} />;
}

export const getServerSideProps = async (ctx) => {
  const path = ctx.resolvedUrl.split('?')[0]

  const container = await injectScript('shop');
  const remote = await container.get(`.${path}`)
    .then((factory) => factory());

  const props = (await remote.getServerSideProps(ctx)).props;

  pageMap.set(ctx.resolvedUrl, remote.default);

  return { props: { path, props } }
}

export default Page;

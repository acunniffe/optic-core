import * as React from 'react'
import { ICogentEngineProps } from '../../../cogent-engines/cogent-engine';
import { OASRoot } from './index';

const OASGenerator = ({ data, api }: ICogentEngineProps) => {
  return <OASRoot endpoints={data.apiSnapshot.endpoints} api={api}/>
};

export {
  OASGenerator,
};

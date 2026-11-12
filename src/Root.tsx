import React from 'react';
import {Composition, Still} from 'remotion';
import {Video, FPS, Roteiro, Timings} from './Video';
import {Serie, RoteiroSerie} from './v2/Serie';
import {Construcao, RoteiroConstrucao} from './v3/Construcao';
import {Obra, RoteiroObra} from './v4/Obra';
import {Receita, RoteiroReceita} from './cozinha/Receita';
import {Historia, RoteiroHistoria} from './historia/Historia';
import roteiroGladiador from '../roteiros/um-dia-como-gladiador-em-roma.json';
import timingsGladiador from '../public/audio/um-dia-como-gladiador-em-roma/timings.json';
import roteiroTitanic from '../roteiros/voce-no-titanic-na-noite-do-naufragio.json';
import timingsTitanic from '../public/audio/voce-no-titanic-na-noite-do-naufragio/timings.json';
import roteiroBolo from '../roteiros/bolo-cenoura.json';
import timingsBolo from '../public/audio/bolo-cenoura/timings.json';
import roteiroBrownie from '../roteiros/brownie-facil.json';
import timingsBrownie from '../public/audio/brownie-facil/timings.json';
import roteiroPizzaFrig from '../roteiros/pizza-de-frigideira.json';
import timingsPizzaFrig from '../public/audio/pizza-de-frigideira/timings.json';
import roteiroCasa from '../roteiros/casa-50m2.json';
import timingsCasa from '../public/audio/casa-50m2/timings.json';
import roteiroEdicula from '../roteiros/edicula-com-churrasqueira.json';
import timingsEdicula from '../public/audio/edicula-com-churrasqueira/timings.json';
import roteiroPiscina from '../roteiros/piscina-de-fibra-6x3-no-quintal.json';
import timingsPiscina from '../public/audio/piscina-de-fibra-6x3-no-quintal/timings.json';
import roteiroKit from '../roteiros/kitnet.json';
import timingsKit from '../public/audio/kitnet/timings.json';
import roteiroKit2 from '../roteiros/kitnet-v2.json';
import timingsKit2 from '../public/audio/kitnet-v2/timings.json';
import roteiroAir from '../roteiros/air-fryer.json';
import timingsAir from '../public/audio/air-fryer/timings.json';
import roteiroSono from '../roteiros/sem-dormir.json';
import timingsSono from '../public/audio/sem-dormir/timings.json';
import {Teste, RoteiroValeAPena} from './valeapena/Teste';
import roteiroAirFryerVP from '../roteiros/air-fryer-barata-vale-a-pena.json';
import timingsAirFryerVP from '../public/audio/air-fryer-barata-vale-a-pena/timings.json';
import {Rico, RoteiroRico} from './rico/Rico';
import {AvatarTostao, BannerTostao} from './rico/tostao';
import roteiroSilvio from '../roteiros/como-o-silvio-santos-ficou-rico.json';
import timingsSilvio from '../public/audio/como-o-silvio-santos-ficou-rico/timings.json';
import {Caso, RoteiroCaso} from './caso/Caso';
import roteiroMH370 from '../roteiros/o-misterio-do-voo-mh370.json';
import timingsMH370 from '../public/audio/o-misterio-do-voo-mh370/timings.json';

const total = (t: Timings) => t.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0);

export const Root: React.FC = () => {
  const ta = timingsAir as Timings;
  const ts = timingsSono as Timings;
  return (
    <>
      <Composition id="air-fryer" component={Video} durationInFrames={total(ta)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroAir as unknown as Roteiro, timings: ta, comAudio: !ta.estimado}} />
      <Composition id="sem-dormir" component={Serie} durationInFrames={total(ts)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroSono as unknown as RoteiroSerie, timings: ts, comAudio: !ts.estimado}} />
      <Composition id="kitnet" component={Construcao} durationInFrames={total(timingsKit as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroKit as unknown as RoteiroConstrucao, timings: timingsKit as Timings, comAudio: !(timingsKit as Timings).estimado, layout: 'kitnet'}} />
      <Composition id="kitnet-v2" component={Construcao} durationInFrames={total(timingsKit2 as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroKit2 as unknown as RoteiroConstrucao, timings: timingsKit2 as Timings, comAudio: true, layout: 'kitnet2'}} />
      <Composition id="casa-50m2" component={Obra} durationInFrames={total(timingsCasa as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroCasa as unknown as RoteiroObra, timings: timingsCasa as Timings, comAudio: !(timingsCasa as Timings).estimado}} />
      <Composition id="edicula-com-churrasqueira" component={Obra} durationInFrames={total(timingsEdicula as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroEdicula as unknown as RoteiroObra, timings: timingsEdicula as Timings, comAudio: !(timingsEdicula as Timings).estimado}} />
      <Composition id="piscina-de-fibra-6x3-no-quintal" component={Obra} durationInFrames={total(timingsPiscina as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroPiscina as unknown as RoteiroObra, timings: timingsPiscina as Timings, comAudio: !(timingsPiscina as Timings).estimado}} />
      <Composition id="bolo-cenoura" component={Receita} durationInFrames={total(timingsBolo as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroBolo as unknown as RoteiroReceita, timings: timingsBolo as Timings, comAudio: !(timingsBolo as Timings).estimado}} />
      <Composition id="brownie-facil" component={Receita} durationInFrames={total(timingsBrownie as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroBrownie as unknown as RoteiroReceita, timings: timingsBrownie as Timings, comAudio: !(timingsBrownie as Timings).estimado}} />
      <Composition id="pizza-de-frigideira" component={Receita} durationInFrames={total(timingsPizzaFrig as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroPizzaFrig as unknown as RoteiroReceita, timings: timingsPizzaFrig as Timings, comAudio: !(timingsPizzaFrig as Timings).estimado}} />
      <Composition id="um-dia-como-gladiador-em-roma" component={Historia} durationInFrames={total(timingsGladiador as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroGladiador as unknown as RoteiroHistoria, timings: timingsGladiador as Timings, comAudio: !(timingsGladiador as Timings).estimado}} />
      <Composition id="voce-no-titanic-na-noite-do-naufragio" component={Historia} durationInFrames={total(timingsTitanic as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroTitanic as unknown as RoteiroHistoria, timings: timingsTitanic as Timings, comAudio: !(timingsTitanic as Timings).estimado}} />
      <Composition id="air-fryer-barata-vale-a-pena" component={Teste} durationInFrames={total(timingsAirFryerVP as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroAirFryerVP as unknown as RoteiroValeAPena, timings: timingsAirFryerVP as Timings, comAudio: !(timingsAirFryerVP as Timings).estimado}} />
      <Still id="avatar-tostao" component={AvatarTostao} width={1080} height={1080} />
      <Still id="banner-tostao" component={BannerTostao} width={2560} height={1440} />
      <Composition id="como-o-silvio-santos-ficou-rico" component={Rico} durationInFrames={total(timingsSilvio as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroSilvio as unknown as RoteiroRico, timings: timingsSilvio as Timings, comAudio: !(timingsSilvio as Timings).estimado}} />
      <Composition id="o-misterio-do-voo-mh370" component={Caso} durationInFrames={total(timingsMH370 as Timings)} fps={FPS} width={1080} height={1920}
        defaultProps={{roteiro: roteiroMH370 as unknown as RoteiroCaso, timings: timingsMH370 as Timings, comAudio: !(timingsMH370 as Timings).estimado}} />
    </>
  );
};

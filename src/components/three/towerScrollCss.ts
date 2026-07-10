import {

  canRotateTower,

  getBelowScrollVisualProgress,

  getDesignerHeroFadeProgress,

  getGalleryScrollProgress,

  getHeroFadeProgress,

  getIdleHintVisibility,

  getInfoRevealProgress,

  getPageScrollProgress,

} from "./infoReveal";

import { isProductHeroPageFromDom } from "../../lib/productHeroScroll";

import { towerDragState } from "./towerDragState";

import { setTowerScrollOffset } from "./towerScrollOffset";



const VAR_EPSILON = 0.0012;



export type ScrollVarState = {

  towerScroll: number;

  infoReveal: number;

  pageScroll: number;

  belowScroll: number;

  galleryProgress: number;

  heroFade: number;

  idleHint: number;

  rotateReady: boolean;

};



export function createScrollVarState(): ScrollVarState {

  return {

    towerScroll: -1,

    infoReveal: -1,

    pageScroll: -1,

    belowScroll: -1,

    galleryProgress: -1,

    heroFade: -1,

    idleHint: -1,

    rotateReady: false,

  };

}



/** Drive layout CSS vars + shared scroll offset from a normalized 0–1 position */

export function applyScrollStats(

  offset: number,

  page: HTMLElement,

  prev: ScrollVarState

) {

  setTowerScrollOffset(offset);

  const productHero =
    page.classList.contains("tower-3d-page--designer") ||
    page.classList.contains("tower-3d-page--utility") ||
    isProductHeroPageFromDom();

  const idleHint = getIdleHintVisibility(offset, productHero);

  const infoReveal = getInfoRevealProgress(offset, productHero);

  const pageScroll = getPageScrollProgress(offset, productHero);

  const belowScroll = getBelowScrollVisualProgress(offset, productHero);

  const galleryProgress = getGalleryScrollProgress(offset);

  const heroFade = productHero

    ? getDesignerHeroFadeProgress(offset)

    : getHeroFadeProgress(offset);



  if (Math.abs(offset - prev.towerScroll) > VAR_EPSILON) {

    page.style.setProperty("--tower-scroll", String(offset));

    prev.towerScroll = offset;

  }

  if (Math.abs(infoReveal - prev.infoReveal) > VAR_EPSILON) {

    page.style.setProperty("--info-reveal", String(infoReveal));

    prev.infoReveal = infoReveal;

  }

  if (Math.abs(pageScroll - prev.pageScroll) > VAR_EPSILON) {

    page.style.setProperty("--page-scroll", String(pageScroll));

    prev.pageScroll = pageScroll;

  }

  if (Math.abs(belowScroll - prev.belowScroll) > VAR_EPSILON) {

    page.style.setProperty("--below-scroll", String(belowScroll));

    prev.belowScroll = belowScroll;

  }

  if (Math.abs(galleryProgress - prev.galleryProgress) > VAR_EPSILON) {

    page.style.setProperty("--gallery-progress", String(galleryProgress));

    prev.galleryProgress = galleryProgress;

  }



  if (Math.abs(heroFade - prev.heroFade) > VAR_EPSILON) {

    page.style.setProperty("--hero-fade", String(heroFade));

    prev.heroFade = heroFade;

  }



  if (Math.abs(idleHint - prev.idleHint) > VAR_EPSILON) {

    page.style.setProperty("--idle-hint", String(idleHint));

    prev.idleHint = idleHint;

  }



  const rotateReady = canRotateTower(offset, productHero);

  towerDragState.canRotate = rotateReady;

  if (rotateReady !== prev.rotateReady) {

    document.documentElement.classList.toggle(

      "tower-3d-rotate-ready",

      rotateReady

    );

    prev.rotateReady = rotateReady;

  }

}


'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
type ImageFormat = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif' | 'tiff';

type NativeImgProps = React.ComponentPropsWithoutRef<'img'>;

export interface ImageProps extends NativeImgProps {
  quality?: number;
  format?: ImageFormat;
  breakpoints?: Array<number>;
}

const DEFAULT_QUALITY = 80;
const DEFAULT_RESOLUTIONS: number[] = [
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048,
  3840,
];

const SRC_ALLOWLIST = [
  '/runtime/api/v1/storage/object/',
  '/aily/api/v1/feisuda/attachments/',
  '/aily/api/v1/files/static/',
];

const ALLOWED_HOSTS = [
  'aka.doubaocdn.com',
  'lf3-static.bytednsdoc.com',
];

const BAD_URL_PATTERNS = [/ve_miaoda/i, /model_error/i, /image_generation_failed/i];

function isBadSrc(src: string): boolean {
  return BAD_URL_PATTERNS.some((p) => p.test(src));
}

function getClosestResolution(target: number): number {
  return DEFAULT_RESOLUTIONS.reduce((prev, curr) => {
    return Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev;
  });
}

function applyParamsToUrl(
  src: string,
  params: Record<string, string | number | undefined>,
): string {
  const search = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => {
      return `${k},${v}`;
    })
    .join('/');
  if (!search) return src;

  const [pathAndQuery = '', hash] = src.split('#');
  const [base, query] = pathAndQuery.split('?');
  const urlParams = new URLSearchParams(query);
  urlParams.set('x-tos-process', `image/${search}`);

  return `${base}?${urlParams.toString()}${hash ? '#' + hash : ''}`;
}

function isTargetSrc(originSrc: string) {
  if (originSrc.endsWith('.svg')) return false;
  if (SRC_ALLOWLIST.some((item) => originSrc.includes(item))) return true;
  try {
    const url = new URL(originSrc);
    return ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

function supportWebp() {
  try {
    return (
      document
        .createElement('canvas')
        .toDataURL('image/webp')
        .indexOf('data:image/webp') === 0
    );
  } catch (err) {
    return false;
  }
}

function buildSrcSet(
  src: string,
  widths: number[],
  format: ImageFormat | undefined,
  quality: number,
  width?: number,
  sizes?: string,
): string | undefined {
  if (!widths || widths.length === 0 || (!width && !sizes)) return undefined;
  const fmt = format;
  if (width) {
    return [1, 2]
      .map((dpr) => {
        const targetWidth = getClosestResolution(width * dpr);
        return `${applyParamsToUrl(src, { resize: `w_${targetWidth}`, quality: `Q_${quality}`, format: fmt })} ${dpr}x`;
      })
      .join(', ');
  }
  return widths
    .map(
      (w) =>
        `${applyParamsToUrl(src, { resize: `w_${w}`, quality: `Q_${quality}`, format: fmt })} ${w}w`,
    )
    .join(', ');
}

function stripTosProcess(src: string): string {
  try {
    const [pathAndQuery = '', hash] = src.split('#');
    const [base, query] = pathAndQuery.split('?');
    if (!query) return src;
    const params = new URLSearchParams(query);
    params.delete('x-tos-process');
    const qs = params.toString();
    return `${base}${qs ? '?' + qs : ''}${hash ? '#' + hash : ''}`;
  } catch {
    return src;
  }
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      width,
      height,
      quality = DEFAULT_QUALITY,
      format,
      sizes,
      srcSet: userSrcSet,
      breakpoints = DEFAULT_RESOLUTIONS,
      className,
      loading = 'lazy',
      decoding = 'async',
      onError,
      ...rest
    },
    ref,
  ) => {
    const [fallbackState, setFallbackState] = React.useState<
      'processed' | 'raw' | 'placeholder'
    >('processed');

    const defaultFormat = React.useMemo(
      () => (supportWebp() ? 'webp' : undefined),
      [],
    );

    const isTarget = typeof src === 'string' && isTargetSrc(src);
    const numericWidth = typeof width === 'number' ? width : undefined;
    const srcIsBad = typeof src === 'string' && isBadSrc(src);

    const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
      if (onError) {
        onError(e);
      }
      if (!isTarget) return;
      if (fallbackState === 'processed') {
        setFallbackState('raw');
      } else if (fallbackState === 'raw') {
        setFallbackState('placeholder');
      }
    };

    // 不在白名单 / 占位符态 / 坏URL：直接渲染占位，不发起请求
    if (!isTarget || fallbackState === 'placeholder' || srcIsBad) {
      return (
        <img
          {...rest}
          ref={ref}
          src={fallbackState === 'placeholder' ? undefined : src}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={userSrcSet}
          className={cn(
            'bg-linear-to-b from-gray-50/20 to-gray-200/20',
            className,
          )}
          loading={loading}
          decoding={decoding}
          onError={handleError}
        />
      );
    }

    const processedSrc =
      fallbackState === 'raw'
        ? stripTosProcess(src)
        : applyParamsToUrl(src, {
            resize: numericWidth ? `w_${numericWidth}` : undefined,
            quality: `Q_${quality}`,
            format: format ?? defaultFormat,
          });

    const processedSrcSet =
      fallbackState === 'raw'
        ? userSrcSet
        : userSrcSet ??
          buildSrcSet(
            src,
            breakpoints,
            format ?? (defaultFormat as ImageFormat),
            quality,
            numericWidth,
            sizes,
          );

    return (
      <img
        {...rest}
        ref={ref}
        src={processedSrc}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={processedSrcSet}
        className={cn(
          'bg-linear-to-b from-gray-50/20 to-gray-200/20',
          className,
        )}
        loading={loading}
        decoding={decoding}
        onError={handleError}
      />
    );
  },
);

Image.displayName = 'Image';

export default Image;

# process

> process 객체에 대한 확장 기능.

`process` 객체는 Electron에서 약간 추가적인 기능이 있으며 API는 다음과 같습니다:

## Events

### Event: 'loaded'

Electron 내부 초기화 스크립트의 로드가 완료되고, 웹 페이지나 메인 스크립트를 로드하기
시작할 때 발생하는 이벤트입니다.

이 이벤트는 preload 스크립트를 통해 node 통합이 꺼져있는 전역 스코프에 node의 전역
심볼들을 다시 추가할 때 사용할 수 있습니다:

```javascript
// preload.js
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
process.once('loaded', () => {
  global.setImmediate = _setImmediate;
  global.clearImmediate = _clearImmediate;
});
```

## Properties

### `process.noAsar`

Setting this to `true` can disable the support for `asar` archives in Node's
built-in modules.

### `process.type`

Current process's type, can be `"browser"` (i.e. main process) or `"renderer"`.

### `process.versions.electron`

Electron's version string.

### `process.versions.chrome`

Chrome's version string.

### `process.resourcesPath`

Path to the resources directory.

### `process.mas`

For Mac App Store build, this property is `true`, for other builds it is
`undefined`.

### `process.windowsStore`

If the app is running as a Windows Store app (appx), this property is `true`,
for otherwise it is `undefined`.

### `process.defaultApp`

When app is started by being passed as parameter to the default app, this
property is `true` in the main process, otherwise it is `undefined`.

## Methods

The `process` object has the following method:

### `process.crash()`

Causes the main thread of the current process crash.

### `process.hang()`

Causes the main thread of the current process hang.

### `process.setFdLimit(maxDescriptors)` _macOS_ _Linux_

* `maxDescriptors` Integer

Sets the file descriptor soft limit to `maxDescriptors` or the OS hard
limit, whichever is lower for the current process.

### `process.getProcessMemoryInfo()`

Returns an object giving memory usage statistics about the current process. Note
that all statistics are reported in Kilobytes.

* `workingSetSize` - The amount of memory currently pinned to actual physical
  RAM.
* `peakWorkingSetSize` - The maximum amount of memory that has ever been pinned
  to actual physical RAM.
* `privateBytes` - The amount of memory not shared by other processes, such as
  JS heap or HTML content.
* `sharedBytes` - The amount of memory shared between processes, typically
  memory consumed by the Electron code itself

### `process.getSystemMemoryInfo()`

Returns an object giving memory usage statistics about the entire system. Note
that all statistics are reported in Kilobytes.

* `total` - The total amount of physical memory in Kilobytes available to the
  system.
* `free` - The total amount of memory not being used by applications or disk
  cache.

On Windows / Linux:

* `swapTotal` - The total amount of swap memory in Kilobytes available to the
  system.
* `swapFree` - The free amount of swap memory in Kilobytes available to the
  system.

----------------------------------------

## Properties

### `process.noAsar`

이 속성을 `true`로 지정하면 Node 빌트인 모듈의 `asar` 아카이브 지원을 비활성화 시킬
수 있습니다.

## Methods

`process` 객체는 다음과 같은 메서드를 가지고 있습니다:

### `process.crash()`

현재 프로세스의 메인 스레드에 크래시를 일으킵니다.

### `process.hang()`

현재 프로세스의 주 스레드를 중단시킵니다.

### `process.setFdLimit(maxDescriptors)` _macOS_ _Linux_

* `maxDescriptors` Integer

현재 프로세스 파일 디스크립터의 제한 값을 소프트 제한 `maxDescriptors`의 값이나 OS 하드
제한 중 낮은 값으로 설정합니다.

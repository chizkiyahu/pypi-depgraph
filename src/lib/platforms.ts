import type { PlatformOption } from '../types.ts'

export interface PlatformDescriptor {
  id: PlatformOption
  label: string
  family: 'linux' | 'windows' | 'macos'
  sysPlatform: string
  platformSystem: string
  osName: string
  machine: string
}

const PLATFORM_DESCRIPTORS: PlatformDescriptor[] = [
  {
    id: 'linux-x86_64',
    label: 'Linux x86_64',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 'x86_64',
  },
  {
    id: 'linux-aarch64',
    label: 'Linux ARM64',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 'aarch64',
  },
  {
    id: 'linux-armv7l',
    label: 'Linux ARMv7',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 'armv7l',
  },
  {
    id: 'linux-x86',
    label: 'Linux x86',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 'i686',
  },
  {
    id: 'linux-ppc64le',
    label: 'Linux PPC64LE',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 'ppc64le',
  },
  {
    id: 'linux-s390x',
    label: 'Linux s390x',
    family: 'linux',
    sysPlatform: 'linux',
    platformSystem: 'Linux',
    osName: 'posix',
    machine: 's390x',
  },
  {
    id: 'windows-x86_64',
    label: 'Windows x86_64',
    family: 'windows',
    sysPlatform: 'win32',
    platformSystem: 'Windows',
    osName: 'nt',
    machine: 'AMD64',
  },
  {
    id: 'windows-arm64',
    label: 'Windows ARM64',
    family: 'windows',
    sysPlatform: 'win32',
    platformSystem: 'Windows',
    osName: 'nt',
    machine: 'ARM64',
  },
  {
    id: 'windows-x86',
    label: 'Windows x86',
    family: 'windows',
    sysPlatform: 'win32',
    platformSystem: 'Windows',
    osName: 'nt',
    machine: 'x86',
  },
  {
    id: 'macos-arm64',
    label: 'macOS ARM64',
    family: 'macos',
    sysPlatform: 'darwin',
    platformSystem: 'Darwin',
    osName: 'posix',
    machine: 'arm64',
  },
  {
    id: 'macos-x86_64',
    label: 'macOS x86_64',
    family: 'macos',
    sysPlatform: 'darwin',
    platformSystem: 'Darwin',
    osName: 'posix',
    machine: 'x86_64',
  },
]

const PLATFORM_DESCRIPTOR_MAP = new Map(
  PLATFORM_DESCRIPTORS.map((descriptor) => [descriptor.id, descriptor]),
)

export const COMMON_PLATFORM_OPTIONS = PLATFORM_DESCRIPTORS.map((descriptor) => descriptor.id)
export const DEFAULT_PLATFORM: PlatformOption = 'linux-x86_64'

export function normalizePlatformTarget(value: string): PlatformOption {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_PLATFORM
  }

  if (normalized === 'linux') {
    return 'linux-x86_64'
  }
  if (normalized === 'windows' || normalized === 'win32') {
    return 'windows-x86_64'
  }
  if (normalized === 'macos' || normalized === 'darwin') {
    return 'macos-arm64'
  }

  return normalized
}

export function getPlatformDescriptor(target: PlatformOption): PlatformDescriptor {
  const normalized = normalizePlatformTarget(target)
  const descriptor = PLATFORM_DESCRIPTOR_MAP.get(normalized)
  if (descriptor) {
    return descriptor
  }

  const [family = 'linux', machine = 'x86_64'] = normalized.split('-', 2)
  return {
    id: normalized,
    label: `${formatFamilyLabel(family)} ${machine}`,
    family: family === 'windows' || family === 'macos' ? family : 'linux',
    sysPlatform: family === 'windows' ? 'win32' : family === 'macos' ? 'darwin' : 'linux',
    platformSystem: family === 'windows' ? 'Windows' : family === 'macos' ? 'Darwin' : 'Linux',
    osName: family === 'windows' ? 'nt' : 'posix',
    machine,
  }
}

export function formatPlatformOption(target: PlatformOption): string {
  return getPlatformDescriptor(target).label
}

export function sortPlatformOptions(values: Iterable<PlatformOption>): PlatformOption[] {
  const order = new Map(COMMON_PLATFORM_OPTIONS.map((value, index) => [value, index]))

  return [...new Set([...values].filter(Boolean).map(normalizePlatformTarget))].sort((left, right) => {
    const leftOrder = order.get(left)
    const rightOrder = order.get(right)
    if (leftOrder !== undefined && rightOrder !== undefined) {
      return leftOrder - rightOrder
    }
    if (leftOrder !== undefined) {
      return -1
    }
    if (rightOrder !== undefined) {
      return 1
    }
    return left.localeCompare(right)
  })
}

function formatFamilyLabel(family: string): string {
  if (family === 'macos') {
    return 'macOS'
  }
  if (family === 'windows') {
    return 'Windows'
  }
  return 'Linux'
}

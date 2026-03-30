import { compare, explain, satisfies, valid } from '@renovatebot/pep440'

const FIRST_SUPPORTED_PYTHON_MINOR = 7
const LATEST_KNOWN_PYTHON_MINOR = 15

export const COMMON_PYTHON_VERSIONS = Array.from(
  { length: LATEST_KNOWN_PYTHON_MINOR - FIRST_SUPPORTED_PYTHON_MINOR + 1 },
  (_, index) => `3.${FIRST_SUPPORTED_PYTHON_MINOR + index}`,
)

export interface VersionChoice {
  selectedVersion: string | null
  legalVersions: string[]
  rejectionReason: string | null
}

export function normalizePackageName(name: string): string {
  return name.trim().toLowerCase().replace(/[-_.]+/g, '-')
}

export function normalizePythonVersion(version: string): string {
  const trimmed = version.trim().toLowerCase().replace(/t$/, '')
  if (/^\d+\.\d+$/.test(trimmed)) {
    return `${trimmed}.0`
  }

  return trimmed
}

function parsePythonVersionLabel(version: string): {
  major: number
  minor: number
  patch: number
  threaded: boolean
} | null {
  const match = version.trim().toLowerCase().match(/^(\d+)\.(\d+)(?:\.(\d+))?(t)?$/)
  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
    threaded: match[4] === 't',
  }
}

function comparePythonVersionLabels(left: string, right: string): number {
  const parsedLeft = parsePythonVersionLabel(left)
  const parsedRight = parsePythonVersionLabel(right)
  if (!parsedLeft || !parsedRight) {
    return left.localeCompare(right)
  }

  if (parsedLeft.major !== parsedRight.major) {
    return parsedLeft.major - parsedRight.major
  }
  if (parsedLeft.minor !== parsedRight.minor) {
    return parsedLeft.minor - parsedRight.minor
  }
  if (parsedLeft.patch !== parsedRight.patch) {
    return parsedLeft.patch - parsedRight.patch
  }
  if (parsedLeft.threaded !== parsedRight.threaded) {
    return parsedLeft.threaded ? 1 : -1
  }

  return left.localeCompare(right)
}

export function sortPythonVersions(versions: Iterable<string>): string[] {
  return [...new Set([...versions].filter(Boolean))].sort(comparePythonVersionLabels)
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set([...values].filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  )
}

function compareVersionsDesc(left: string, right: string): number {
  return compare(right, left)
}

export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort(compareVersionsDesc)
}

function filterValidVersions(versions: string[]): string[] {
  return versions.filter((version) => Boolean(valid(version)))
}

function isStableRelease(version: string): boolean {
  const parsed = explain(version)
  if (!parsed) {
    return false
  }

  return !parsed.is_prerelease && !parsed.is_devrelease
}

function matchesAllSpecifiers(version: string, specifiers: string[], prereleases: boolean): boolean {
  return specifiers.every((specifier) =>
    specifier ? satisfies(version, specifier, { prereleases }) : true,
  )
}

export function selectVersion(
  versions: string[],
  specifiers: string[],
  manualOverride?: string | null,
): VersionChoice {
  const normalizedSpecifiers = specifiers.filter(Boolean)
  const sortedVersions = sortVersionsDescending(filterValidVersions(versions))

  const stableMatches = sortedVersions.filter((version) =>
    isStableRelease(version) && matchesAllSpecifiers(version, normalizedSpecifiers, false),
  )
  const prereleaseMatches =
    stableMatches.length > 0
      ? stableMatches
      : sortedVersions.filter((version) => matchesAllSpecifiers(version, normalizedSpecifiers, true))

  if (manualOverride) {
    if (!prereleaseMatches.includes(manualOverride)) {
      return {
        selectedVersion: null,
        legalVersions: prereleaseMatches,
        rejectionReason: `Manual version ${manualOverride} does not satisfy the active constraints.`,
      }
    }

    return {
      selectedVersion: manualOverride,
      legalVersions: prereleaseMatches,
      rejectionReason: null,
    }
  }

  return {
    selectedVersion: prereleaseMatches[0] ?? null,
    legalVersions: prereleaseMatches,
    rejectionReason: prereleaseMatches.length
      ? null
      : normalizedSpecifiers.length
        ? 'No released version satisfied the active constraints.'
        : 'No valid release versions were available on PyPI.',
  }
}

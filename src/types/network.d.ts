interface NetworkInformation {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

interface Navigator {
  connection?: NetworkInformation
}

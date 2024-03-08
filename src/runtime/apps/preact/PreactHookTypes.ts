export enum PreactHookTypes {
  useState = 1,
  useReducer = 2,
  useEffect = 3,
  useLayoutEffect = 4,
  useRef = 5,
  useImperativeHandle = 6,
  useMemo = 7,
  useCallback = 8,
  useContext = 9,
  useErrorBoundary = 10,
  // Not a real hook, but the devtools treat is as such
  useDebugvalue = 11,
}

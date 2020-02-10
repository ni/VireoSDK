<!--
Copyright (c) 2020 National Instruments
SPDX-License-Identifier: MIT
-->

# String Format Time Manual Test

1. Run the test `StringFormatTime.via` with `./test.js StringFormatTime.via`
2. Verify the results match similarly to the `results/StringFormatTime.vtr`
3. If the results are too different, consult with CurrentGen LabVIEW for the proper response.

### Notes
- The Timezone abbrevation (`%Z`) will almost always be of the three letter form.
- When `StringFormat` is provided a `Double` value, the result will always process the value as the current system timezone for the system that it is run on.
  - If provided with a `Timestamp` variable, the timezone will be respected as `Timestamp` has a parameter for timezone.

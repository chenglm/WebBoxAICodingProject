#!/usr/bin/env sh

# Source this file before Maven commands: . scripts/use-project-java.sh
WEBBOX_JDK17_HOME="${WEBBOX_JDK17_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"

if [ ! -x "${WEBBOX_JDK17_HOME}/bin/java" ]; then
  echo "JDK 17 was not found at ${WEBBOX_JDK17_HOME}. Set WEBBOX_JDK17_HOME and source this script again." >&2
  return 1 2>/dev/null || exit 1
fi

export JAVA_HOME="${WEBBOX_JDK17_HOME}"
export PATH="${JAVA_HOME}/bin:${PATH}"
echo "WebBox uses Java: $(java -version 2>&1 | head -n 1)"

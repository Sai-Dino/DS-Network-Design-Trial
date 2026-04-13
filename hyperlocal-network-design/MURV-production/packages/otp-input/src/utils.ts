export const formatTime = (secondsCount: number): string => {
  const minutesCount: number = Math.floor(secondsCount / 60);
  const remainingSeconds: number = secondsCount % 60;
  const formattedMinutes: string = minutesCount < 10 ? `0${minutesCount}` : `${minutesCount}`;
  const formattedSeconds: string =
    remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
  return `${formattedMinutes}:${formattedSeconds}`;
};

import {bitable} from '@lark-base-open/js-sdk';
import {ref, onMounted} from "vue";

export const useTheme = () => {
  const theme = ref('');
  const setThemeColor = () => {
    const el = document.documentElement;
    const themeStyles: any = {
      LIGHT: {
        '--el-color-primary': 'rgb(20, 86, 240)',
        '--el-bg-color': '#fff',
        '--el-border-color-lighter': '#dee0e3',
      },
      DARK: {
        '--el-color-primary': '#4571e1',
        '--el-bg-color': '#252525',
        '--el-border-color-lighter': '#434343',
      },
    };
    const currentThemeStyles = themeStyles[theme.value];
    Object.entries(currentThemeStyles).forEach(([property, value]: any) => {
      el.style.setProperty(property, value);
    });
  };

  onMounted(async () => {
    theme.value = await bitable.bridge.getTheme();
    setThemeColor();
  });

  bitable.bridge.onThemeChange((event) => {
    theme.value = event.data.theme;
    setThemeColor();
  });

  return {
    theme
  };
};

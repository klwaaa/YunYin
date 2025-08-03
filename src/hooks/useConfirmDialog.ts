import {ref} from 'vue';

export function useConfirmDialog() {
  const confirmDialogVisible = ref(false);
  const confirmDialogTitle = ref("确认");
  const confirmDialogMessage = ref("");
  let confirmResolve: (v: boolean) => void;
  
  function show(message: string, title = "确认"): Promise<boolean> {
    return new Promise((resolve) => {
      confirmDialogTitle.value = title;
      confirmDialogMessage.value = message;
      confirmDialogVisible.value = true;
      confirmResolve = resolve;
    });
  }
  
  function confirm() {
    confirmDialogVisible.value = false;
    confirmResolve(true);
  }
  
  function cancel() {
    confirmDialogVisible.value = false;
    confirmResolve(false);
  }
  
  return {
    confirmDialogVisible,
    confirmDialogTitle,
    confirmDialogMessage,
    show,
    confirm,
    cancel
  };
}
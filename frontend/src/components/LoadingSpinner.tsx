
const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryAccent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

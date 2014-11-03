function quicksort(S, i, f, customkey){

	var partition = function(A, i, f, pivot){

		var p = Number(A[pivot]);
		if(customkey !== undefined){
			p = Number(A[pivot][customkey]);
		}
		swap(A, pivot, f-1);
		var next_idx = i;
		for(var ix = i; ix < (f-1); ix++){
			var Aix = Number(A[ix]);
			if(customkey !== undefined){
				Aix = Number(A[ix][customkey]);
			}
			if(Aix <= p){
				swap(A, next_idx, ix);
				next_idx++;
			}
		}
		swap(A, f-1, next_idx);
		return next_idx;
	}

	var swap = function(A, a, b){
		var tmp=A[a];
		A[a]=A[b];
		A[b]=tmp;
	}

	if(f-1 > i){
		var pivot = i + Math.floor(0.5 * (f-i)); //median(i, f);

		pivot = partition(S, i, f, pivot);

		quicksort(S, i, pivot);
		quicksort(S, pivot+1, f);
	}
}
module.exports = {
  quicksort: quicksort
};
